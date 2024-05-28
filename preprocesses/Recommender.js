require('dotenv').config();
const fs = require("fs");
const {OpenAI} = require("openai");
const crypto = require('crypto');

const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});

class Recommender {

    constructor(config) {
        this.config = config;
        this.filePath = __dirname + '/products_export.json';

        this.optsAssistant = {
            name: "Bag Recommender CLI",
            instructions: "You are an expert on products in products_export.json (~FILENAME~).\n" +
                "\n" +
                "Users will provide answers to questions describing their preferences. You should find 3 matching products.\n" +
                "\n" +
                "Respond with only a JSON array of objects in this format `[{product_id:#, reason:#, score:#}, ...]`",
            model: "gpt-4.0-turbo"
        }

        this.optsThread = {
            // TODO: maybe do a role: assistant to improve the instructions
            messages: [
                {
                    role: "user",
                    content: "Find 3 matching products described by this user's answers to the following questions: \n\n" +
                        "What type of bag do you need?: Backpacks.\n\n" +
                        "What do you use your bag for?: Work and Commuting.\n\n" +
                        "What's your price point?: under $300. \n\n" +
                        "How much space do you want in your bag?: As big as possible. \n\n" +
                        "How many compartments do you need?: many.\n\n" +
                        "Do you take your bags through airports or on trips?: yes. \n\n" +
                        "What color do you prefer?: black or grey.\n\n" +
                        "Respond with only a JSON array of objects in this format `[{product_id:#, reason:#, score:#}, ...]`",
                },
            ],
        }

        this.testId = this.makeTestId(JSON.stringify(this.optsAssistant) + JSON.stringify(this.optsThread))
        this.resultsPath = `${__dirname}/results/results-${this.testId}.json`

        this.optsRun = {}

    }

    getConfigId() {
        let id = [];
        if (this.config.assistant) {
            id.push('assistant')
        } else {
            id.push('chat')
        }
        if (this.config.code_interpreter) {
            id.push('code')
        }
        if (this.config.file_search) {
            id.push('search')
        }
        if (this.config.embeddings) {
            id.push('embeddings')
        }
        return id.join('-')
    }

    makeTestId(inputString) {
        const sha256Hash = crypto.createHash('sha256');
        sha256Hash.update(inputString);
        const checksum = sha256Hash.digest('hex');
        return checksum;
    }

    async complete() {
        await this.createFile();
        await this.createVectorStore();
        await this.createAssistant();
        this.started = new Date().getTime();
        await this.createThread();
        await this.runThread();
    }

    async createFile() {
        if (this.config.file_id) {
            this.file = {id: this.config.file_id}
        } else {
            this.file = await openai.files.create({
                file: fs.createReadStream(this.filePath),
                purpose: "assistants",
            });
        }

        this.optsAssistant.instructions = this.optsAssistant.instructions.replace('~FILENAME~', this.file.id);
    }

    async createAssistant() {
        if (this.config.assistant_id) {
            this.assistant = {id: this.config.assistant_id}
        } else {
            if (this.config.code_interpreter || this.config.file_search) {
                this.optsAssistant.tools = [];
                this.optsAssistant.tool_resources = {}
            }

            if (this.config.code_interpreter) {
                this.optsAssistant.tools.push({type: "code_interpreter"});
                this.optsAssistant.tool_resources.code_interpreter = {
                    "file_ids": [this.file.id]
                }
            }
            if (this.config.file_search) {
                this.optsAssistant.tools.push({type: "file_search"});

                this.optsAssistant.tool_resources.file_search = {
                    "vector_store_ids": [this.vector.id]
                }
            }

            this.assistant = await openai.beta.assistants.create(this.optsAssistant);
        }

        if (this.config.file_search) {
            if (this.config.assistant) {
                await openai.beta.assistants.update(this.assistant.id, {
                    tool_resources: {file_search: {vector_store_ids: [this.vector.id]}},
                });
            } else if (this.thread.id) {
                await openai.beta.threads.update(this.thread.id, {
                    tool_resources: {file_search: {vector_store_ids: [this.vector.id]}},
                });
            }
        }

    }

    async createThread() {
        if (this.config.thread_id) {
            this.thread = {id: this.config.thread_id}
        } else {
            if (this.config.code_interpreter || this.config.file_search) {
                this.optsThread.messages[0].attachments = [{file_id: this.file.id, tools: this.optsAssistant.tools}];
            }
            this.thread = await openai.beta.threads.create(this.optsThread);
        }
    }

    async createVectorStore() {

        if (this.config.vector_store_id) {
            this.vector = {id: this.config.vector_store_id};
        } else {
            this.vector = await openai.beta.vectorStores.create({
                name: "Bag Product Information",
                file_ids: [this.file.id],
                expires_after: {
                    anchor: "last_active_at",
                    days: 7
                }
            });
        }

    }

    async createEmbeddings() {

        const fileStreams = [];
        const product_json = JSON.parse(fs.readSync(this.filePath));

        const token_keys = [
            "Product ID",
            "Handle",
            "Title",
            "Description",
            "Product Category",
            "Type",
            "Tags",
            "Variant Grams",
            "Price USD $"
        ]

        for await (const row of product_json) {
            const parts = token_keys.map(key => `${key} = ${row[key]}`)

            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: parts,
                // dimensions: token_keys.length
            });

            const vector = embedding.data.embedding;
            const vectorString = vector.join(',');
            const stream = Buffer.from(vectorString, 'utf-8');
            fileStreams.push(stream);
        }

        // Create a vector store including our two files.
        let vectorStore = await openai.beta.vectorStores.create({
            name: "Bag Product Embeddings",
        });

        await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, fileStreams)

        await openai.beta.threads.update(this.thread.id, {
            tool_resources: {file_search: {vector_store_ids: [vectorStore.id]}},
        });

    }

    runThread() {
        if (this.assistant) {
            this.optsRun.assistant_id = this.assistant.id;
        } else {
            this.optsRun.instructions = this.optsAssistant.instructions;
        }

        let response_str = '';

        openai.beta.threads.runs.stream(this.thread.id, this.optsRun)
            .on('textCreated', (text) => process.stdout.write('\nAssistant Created > \n'))
            .on('toolCallCreated', (toolCall) => process.stdout.write(`\nAssistant Call > ${toolCall.type}\n`))
            .on('toolCallDelta', (toolCallDelta, snapshot) => {
                if (toolCallDelta.type === 'file_search') {
                    process.stdout.write("\nFile Search Output:\n");
                    if (toolCallDelta.file_search.outputs) {
                        toolCallDelta.file_search.outputs.forEach(filePath => {
                            process.stdout.write(filePath);
                        });
                    }
                } else if (toolCallDelta.type === 'code_interpreter') {
                    process.stdout.write("\nCode Interpreter Output:\n");
                    if (toolCallDelta.code_interpreter.outputs) {
                        toolCallDelta.code_interpreter.outputs.forEach(output => {
                            if (output.type === "logs") {
                                process.stdout.write(`\n${output.logs}\n`);
                            }
                        });
                    }
                }
            })
            .on('textDelta', (textDelta, snapshot) => {
                response_str += textDelta.value;
                process.stdout.write(textDelta.value)
            })
            .on('messageDone',  (data) => {
                this.ended = new Date().getTime();

                process.stdout.write("\nFINAL JSON!! :\n");
                const response_json = this.findJson(response_str);
                process.stdout.write(response_str);
                this.validateResponse(response_json)
            })
    }

    async validateResponse(response_json) {

        const tracker = (fs.existsSync(this.resultsPath)) ?
            JSON.parse(fs.readFileSync(this.resultsPath)) : {}

        const id = this.getConfigId();
        if (typeof tracker[id] === 'undefined') tracker[id] = {};

        tracker[id] = {
            ms: this.ended - this.started,
            started: new Date(this.started).toString(),
            ended: new Date(this.ended).toString(),
            config: {
                file_id : this.file.id,
                thread_id : this.thread.id,
            },
            model : this.optsAssistant.model,
            prompt : this.optsThread.messages
        }

        if (this.config.assistant) {
            tracker[id].instructions = this.optsAssistant.instructions;
            tracker[id].config.assistant_id = this.assistant.id
        }
        if (this.config.file_search) {
            tracker[id].config.vector_store_id = this.vector.id
        }

        const file = fs.readFileSync(this.filePath);
        const product_json = JSON.parse(file);

        if (Array.isArray(response_json)) {
            response_json.forEach(resp => {
                const hasId = product_json.findIndex(p => p['Product ID'] === resp.product_id);
                if (hasId > 0) {
                    resp.passed = true;
                    console.log('passed ' + resp.product_id, resp);
                } else {
                    resp.passed = false;
                    console.error('no such product id ', resp);
                }
                // delete resp.reason;
            });
        }

        tracker[id].results = response_json;

        fs.writeFileSync(this.resultsPath, JSON.stringify(tracker));
    }


    findJson(str) {
        const startIndex = Math.min(str.indexOf('{'), str.indexOf('['));

        if (startIndex === -1) {
            console.error('No JSON object found in the string.');
            return null;
        }

        const endChar = str[startIndex] === '[' ? ']' : '}';
        const endIndex = str.lastIndexOf(endChar);

        if (endIndex === -1) {
            console.error('Invalid JSON object format.');
            return null;
        }

        const jsonString = str.substring(startIndex, endIndex + 1);

        try {
            const jsonObject = JSON.parse(jsonString);
            return jsonObject;
        } catch (error) {
            console.error('Error parsing JSON:', str, error);
            return null;
        }
    }

}

module.exports = Recommender;


