from dotenv import load_dotenv
import csv
import datetime
import json
import os
import sys

from openai import AssistantEventHandler
from openai import OpenAI

from preprocesses.Embeddings import Embeddings
from preprocesses.Utils import find_id_property, find_json, adler32, stringify_survey, find_nearby_file
load_dotenv()

class Prompter:
    def __init__(self, prompt, config, survey):
        self.prompt = prompt
        self.config = config
        self.openai = OpenAI(api_key=os.getenv("OPENAI_KEY"))

        self.file = None
        self.thread = None
        self.assistant = None
        self.vector = None

        if os.path.exists(self.config["file_path"]):
            if ".pkl" not in self.config["file_path"] and ".json" not in self.config["file_path"]: # csv can be retrieved: https://platform.openai.com/docs/assistants/tools/file-search/supported-files
                print(f"Check OpenAI's docs if they're supporting this filetype: https://platform.openai.com/docs/assistants/tools/file-search/supported-files. Also try running `python DatIandexer.py normalize_dataset <product_file> <source_key>`")
                sys.exit(1)

        elif self.config["file_path"][0:5] != 'file-':
            print(f"Missing file data reading: {self.config['file_path']}")
            sys.exit(1)

        self.survey = survey
        self.survey_str = stringify_survey(survey)

        if "__RFORMAT__" in self.prompt["response"]:
            self.prompt["prompt"] = self.prompt["prompt"].replace('__RFORMAT__', self.survey_str)
            self.prompt["instruction"] = self.prompt["instruction"].replace('__RFORMAT__', self.survey_str)

        if "__FILENAME__" in self.prompt["prompt"]:
            self.prompt["prompt"] = self.prompt["prompt"].replace('__FILENAME__', self.survey_str)
        elif "__FILENAME__" in self.prompt["instruction"]:
            self.prompt["instruction"] = self.prompt["instruction"].replace('__FILENAME__', self.survey_str)


        if "__USERDATA__" in self.prompt["prompt"]:
            self.prompt["prompt"] = self.prompt["prompt"].replace('__USERDATA__', self.survey_str)
        elif "__USERDATA__" in self.prompt["instruction"]:
            self.prompt["instruction"] = self.prompt["instruction"].replace('__USERDATA__', self.survey_str)
        else:
            self.survey = False
            self.survey_str = ""

        self.opts_assistant = {
            "name": f"Prompt Automator",
            "instructions": self.prompt["instruction"],
            "model": self.config["model"],
#            'tools': [],
#            'tool_resources': {}
        }

        self.opts_thread = {
            "messages": [
                {
                    "role": "user",
                    "content": self.prompt["prompt"]
                }
            ]
        }

        self.test_id = adler32(json.dumps(self.prompt) + json.dumps(self.config) + self.survey_str)

        if "test_id" in self.config:
            self.opts_assistant["name"] += " - " + self.config['test_id']
        else:
            self.opts_assistant["name"] += " - " + self.test_id

        results_dir = os.path.join(os.path.dirname(__file__), '../public/results')
        if not os.path.exists(results_dir):
            os.makedirs(results_dir)

        self.results_path = f'{results_dir}/result-{self.test_id}.json'
        self.opts_run = {}


    async def complete(self):
        self.started = datetime.datetime.now()
        self.ended = datetime.datetime.now()

        if self.config["executable"] == 'Thread':
            await self.create_file()
            if self.file is None:
                print(f"Failed to get file: {self.config['file_path']}")
            else:
                await self.create_vector_store()
                await self.create_assistant()
                self.started = datetime.datetime.now()
                await self.create_thread()
                # await self.create_embeddings_withasst() # not sure if this is possible or practical
                await self.run_thread()
        elif self.config["executable"] == 'Embeddings':
            self.create_embeddings()
        else:
            await self.run_completion()

    async def run_completion(self):
        self.started = datetime.datetime.now()

        message = [{"role": "system", "content": self.opts_assistant["instructions"]}]

        if self.config["file_path"]:
            f = open(self.config["file_path"], "r")
            content = f.read()

            if len(content) > 16385:
                content = json.dumps(json.loads(content)) # strip pretty print if too long
            #if len(content) > 16385:
            #    maybe try csv instead?

            message.append({"role": "system", "content": f"Make your recommendation based on this data: \n\n {content}"})

        message.append({"role": "user", "content": self.opts_thread["messages"][0]["content"]})

        try:
            response_str = self.openai.chat.completions.create(
                model=self.opts_assistant['model'],
                messages=message
            )
            self.ended = datetime.datetime.now()
            response_str = self.get_nested(response_str, ['choices', 0, 'message', 'content'], default="Failed to access ChatCompletion correctly")
            print("\nCompletion Response:\n", response_str)
            response_json = find_json(response_str)
            self.validate_response(response_json, response_str)
        except Exception as e:
            self.ended = datetime.datetime.now()
            print(f"Completion Failed: {e}")
            self.validate_response(None, str(e))

    async def create_file(self):
        if self.config["file_path"][0:5] == 'file-':
            self.file = self.openai.files.retrieve(self.config["file_path"])
        elif os.path.exists(self.config["file_path"]) is False:
            files = self.openai.files.list()
            for file in files:
                if file.filename == os.path.basename(self.config["file_path"]):
                    self.file = file
                    break
        else:
            self.file = self.openai.files.create(file=open(self.config["file_path"], 'rb'), purpose="assistants")

    def get_dataset(self):
        if self.file and self.file.purpose == 'assistants': # cannot download these
            files = find_nearby_file(self.file.filename, os.path.join(os.path.dirname(__file__), '..'))
            if len(files) > 0:
                with open(files[0], 'r') as file:
                    return json.load(file)
        elif self.file and self.file.purpose != 'assistants': # cannot download these
            return self.openai.files.content(self.file.id)
        elif self.config["file_path"][0:5] == 'file-':
            return self.openai.files.content(self.config["file_path"])
        elif os.path.exists(self.config["file_path"]) is False:
            files = self.openai.files.list()
            for file in files:
                if file.filename == os.path.basename(self.config["file_path"]):
                    return self.openai.files.content(self.file.id)
        else:
            with open(self.config["file_path"], 'r') as file:
                return json.load(file)


    async def create_assistant(self):
        self.opts_assistant['tools'] = []
        self.opts_assistant['tool_resources'] = {}

        if self.config["code_interpreter"]:
            self.opts_assistant['tools'].append({"type": "code_interpreter"})
            self.opts_assistant['tool_resources']['code_interpreter'] = {"file_ids": [self.file.id]}

        if self.config["file_search"]:
            self.opts_assistant['tools'].append({"type": "file_search"})
            self.opts_assistant['tool_resources']['file_search'] = {"vector_store_ids": [self.vector.id]}

        if type(self.config["assistant"]) is str and self.config["assistant"][0:len("asst_")] == 'asst_':
            self.assistant = self.openai.beta.assistants.retrieve(self.config["assistant"])
        else:
            self.assistant = self.openai.beta.assistants.create(**self.opts_assistant)

        if self.config["file_search"]:
            self.openai.beta.assistants.update(self.assistant.id,
                                               tool_resources={"file_search": {
                                                   "vector_store_ids": [self.vector.id]}}
                                               )
            if self.thread is not None and "id" in self.thread:
                self.openai.beta.threads.update(self.thread.id,
                                                tool_resources={
                                                    "file_search": {"vector_store_ids": [self.vector.id]}})


    async def create_thread(self):
#        if self.config["thread"] is str and self.config["thread"][0:7] == 'thread_':
#            self.thread = await self.openai.beta.threads.retrieve(self.config["thread"])
#        else:
        if self.config["code_interpreter"] or self.config["file_search"]:
            self.opts_thread['messages'][0]['attachments'] = [
                {"file_id": self.file.id, "tools": self.opts_assistant['tools']}]
        self.thread = self.openai.beta.threads.create(**self.opts_thread)

    async def create_vector_store(self):
        if type(self.config["vector_store"]) is str and self.config["vector_store"][0:3] == 'vs_':
            self.vector = self.openai.beta.vector_stores.retrieve(self.config["vector_store"])
            current_timestamp = int(datetime.datetime.now().timestamp())
            if current_timestamp < self.vector.expires_at:

                if "assistant" in self.config and self.config["assistant"][0:5] == 'asst_':
                    self.openai.beta.assistants.update(self.config["assistant"],
                                                             tool_resources={"file_search": {
                                                                 "vector_store_ids": [self.vector.id]}}
                                                             )

                if "thread" in self.config and self.config["thread"][0:5] == 'thread_':
                    self.openai.beta.threads.update(
                        self.config["thread"],
                        tool_resources={"file_search": {"vector_store_ids": [self.vector.id]}},
                    )

                return self.vector

        self.vector = self.openai.beta.vector_stores.create(name=f"Vector Store {self.config['file_path']}", file_ids=[self.file.id],
                                                            expires_after={"anchor": "last_active_at", "days": 7})
        return self.vector

    def create_embeddings(self):
        self.started = datetime.datetime.now()
        self.embeddings = Embeddings(self.config["file_path"])
        topass = self.survey_str if self.survey_str else self.prompt["prompt"]
        response_json = self.embeddings.find_recommendations(topass)
        self.ended = datetime.datetime.now()
        print("\nFINAL JSON!! :\n", response_json)
        self.validate_response(response_json, response_json)

    async def run_thread(self):
        if self.assistant:
            self.opts_run["assistant_id"] = self.assistant.id
        else:
            self.opts_run["instructions"] = self.opts_assistant["instructions"]

        event_handler = EventHandler()

        self.opts_run['thread_id'] = self.thread.id
        with self.openai.beta.threads.runs.stream(
                **self.opts_run,
                event_handler=event_handler,
        ) as stream:
            stream.until_done()

            response_str = event_handler.response()

            self.ended = datetime.datetime.now()
            print("\nFINAL JSON!! :\n", response_str)
            response_json = find_json(response_str)
            self.validate_response(response_json, response_str)

    def validate_response(self, response_json, response_str=''):
        tracker = {}
        if os.path.exists(self.results_path):
            with open(self.results_path, 'r') as file:
                tracker = json.load(file)

        config_id = self.get_config_id()
        if config_id not in tracker:
            tracker[config_id] = {}

        tracker[config_id] = {
            "ms": (self.ended - self.started).total_seconds(),
            "started": self.started.strftime('%Y-%m-%d %H:%M:%S'),
            "ended": self.ended.strftime('%Y-%m-%d %H:%M:%S'),
            "model": self.opts_assistant["model"],
            "prompt": self.opts_thread["messages"][0]["content"],
            "survey_id": adler32(self.survey_str),
            "response":self.prompt['response'],
            "instructions": self.opts_assistant["instructions"],
            "config": self.config,
        }

        tests = {"file_id": self.file, "thread_id": self.thread, "assistant_id":self.assistant, "vector_store_id":  self.vector}
        for key, obj in tests.items():
            if obj is not None and "id" in obj:
                tracker[config_id]['config'][key] = obj["id"]
            elif obj is not None and hasattr(obj, 'id'):
                tracker[config_id]['config'][key] = obj.id

        tracker[config_id]["results"] = response_str if isinstance(response_str, str) and len(response_str) > 0 else response_json

        if self.config["file_path"]:
            try:
                product_json = self.get_dataset()
                if isinstance(product_json, list) and isinstance(response_json, list):
                    key = find_id_property(response_json[0])
                    if key:
                        for resp in response_json:
                            has_id = any(p[key] == resp[key] for p in product_json)
                            if has_id:
                                resp["exists"] = True
                                print('exists', resp[key], resp)
                            else:
                                resp["exists"] = False
                                print(f'no such key {key}', resp)
                    tracker[config_id]["results"] = response_json

            except Exception as e:
                print("Could not validate from dataset", e.message)

        with open(self.results_path, 'w') as file:
            json.dump(tracker, file)


    def get_config_id(self):
        id_parts = []
        if self.config["executable"] == 'Embeddings':
            id_parts.append('embeddings')
        elif self.config["executable"] == 'Thread':
            id_parts.append('thead')
        elif self.config["executable"] == 'Completion':
            id_parts.append('completion')

        if self.config["file_search"]:
            id_parts.append('file')
        if self.config["assistant"]:
            id_parts.append('assistant')
        if self.config["code_interpreter"]:
            id_parts.append('code')
        return '-'.join(id_parts)


class EventHandler(AssistantEventHandler):
    def __init__(self):
        super().__init__()
        self._response = ''

    def response(self):
        return self._response

    def on_text_created(self, text) -> None:
        print(f"\nassistant > ", end="", flush=True)

    def on_text_delta(self, delta, snapshot):
        print(delta.value, end='')
        self._response += delta.value

    def on_tool_call_created(self, tool_call):
        print(f"\nassistant > {tool_call.type}\n", flush=True)

    def on_tool_call_delta(self, delta, snapshot):
        if delta.type == 'code_interpreter':
            if delta.code_interpreter.input:
                print(delta.code_interpreter.input, end="", flush=True)
            if delta.code_interpreter.outputs:
                print(f"\n\noutput >", flush=True)
                for output in delta.code_interpreter.outputs:
                    if output.type == "logs":
                        print(f"\n{output.logs}", flush=True)
