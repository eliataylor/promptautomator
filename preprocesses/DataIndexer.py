import csv
import json
import os
import shutil
import sys

import aiofiles
from dotenv import load_dotenv
from preprocesses.Embeddings import Embeddings
from preprocesses.Utils import convert_to_number, sanitize_header, cast_to_boolean, make_label, check_type, parse_date, reconstruct_object, build_survey, stringify_survey, adler32

load_dotenv()

async def build_embeddings(file_path):
    Embeddings(file_path)



def add_column(val, key):
    column = {
        'field': key,
        'headerName': make_label(key),
        'type': check_type(val),
        'sortable': True,
        'filterable': True
    }
    if key in ['started', 'ended', 'response', 'model', 'prompt_id']:
        column['showing'] = False

    if column['type'] == 'str':
        if '_ids' in key:
            column['type'] = 'array'
            column['filterable'] = False
        elif parse_date(val) is not None:
            column['type'] = 'time'
            column['filterable'] = False
    else:
        if column['type'] != 'dict':
            column['filterable'] = False

        # if column['type'] == 'dict':
        #     column['style'] = {'flexGrow': 1, 'wordBreak': 'break-word'}

    return column

async def index_results():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', os.getenv("RESULTS_DIR")))
    files = os.listdir(output_dir)
    json_files = [file for file in files if file.endswith('.json')]

    results = []
    columns = {}

    for filename in json_files:
        file_path = os.path.join(output_dir, filename)
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            data = await f.read()
            json_data = json.loads(data)
            for run in json_data:
                top_level_properties = {'filename': filename, 'runkey': run}
                for key, value in json_data[run].items():
                    top_level_properties[key] = value
                    if key not in columns:
                        columns[key] = add_column(value, key)

                unsets = ['assistant', 'file_search', 'vector_store', 'code_interpreter']
                for u in unsets:
                    if u in top_level_properties['config']:
                        del top_level_properties['config'][u]

                if 'file_id' in top_level_properties['config'] and top_level_properties['config']['file_id'] == top_level_properties['config']['file_path']:
                    del top_level_properties['config']['file_path']

                results.append(top_level_properties)

    # columns.sort(key=lambda x: x.get('started'))
    columns = reconstruct_object(columns, ['ms', 'started', 'ended', 'prompt', 'instructions', 'survey_id', 'response', 'config', 'results'])

    field_schema = json.dumps(columns, indent=2)  # Pretty-print with 2-space indentation
    new_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src/schema.json'))
    async with aiofiles.open(new_path, 'w', encoding='utf-8') as f:
        await f.write(field_schema)

    json_string = json.dumps(results, indent=2)  # Pretty-print with 2-space indentation
    new_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public', os.getenv("REACT_APP_RESULTS_INDEX")))
    async with aiofiles.open(new_path, 'w', encoding='utf-8') as f:
        await f.write(json_string)


    print('Results Index:', results)
    print('New Schema:', field_schema)

async def index_surveys(survey_file):
    output_file = os.getenv("SURVEYS_INDEX")
    if os.path.exists(output_file):
        # Read and parse the existing JSON file
        with open(output_file, 'r') as file:
            data = json.load(file)
    else:
        data = {}

    survey_list = build_survey(survey_file)
    for survey in survey_list:
        id = adler32(stringify_survey(survey))
        data[id] = survey

        """
        aslist = []
        for question, answer in survey.items():
            aslist.append({"question":question, "answer": answer})

        data[id] = aslist
        """

    # Save the updated data back to the file
    with open(output_file, 'w') as file:
        json.dump(data, file, indent=4)

    print(data)



async def normalize_dataset(file_path, source_key):

    if ".csv" in file_path:  # csv can be retrieved: https://platform.openai.com/docs/assistants/tools/file-search/supported-files
        base, _ = os.path.splitext(file_path)
        json_data = []

        try:
            with open(file_path, mode='r', newline='', encoding='utf-8') as csv_file:
                csv_reader = csv.DictReader(csv_file)
                data = []
                file_path = base + '.json'

                for row in csv_reader:
                    new_row = {}
                    for key, value in row.items():
                        new_key = sanitize_header(key)
                        new_key = new_key.replace(source_key, "source_id")

                        new_row[new_key] = cast_to_boolean(value)
                        new_row[new_key] = convert_to_number(value)

                    data.append(new_row)

                with open(file_path, mode='w', encoding='utf-8') as json_file:
                    json.dump(data, json_file)

        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            sys.exit(1)

    new_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public", os.getenv("REACT_APP_DATASET_PATH")))
    shutil.copy(file_path, new_path)
    print(f'created {os.getenv("REACT_APP_DATASET_PATH")}. You may change the path in your .env file to anywhere in your public folder')

