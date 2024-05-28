### To speed along development or any Issues, consider [sponsoring](https://github.com/sponsors/eliataylor)

-----

## Environment Setup 
- `git clone git@github.com:eliataylor/promptautomator.git`
- create `.env` file with `OPENAI_KEY=you-api-key`
- `python3.9 -m venv .venv`
- `source .venv/bin/activate`
- `pip install -r requirements.txt`


## Create AI Prompts and Instructions

## Create End-User Data

## Transform your data set to JSON
- `node data-transformer.js products_export.csv` > will create a products_export.json (an optional step to reduce noise in your data set)  
- `python data-transformer.py products_export.json` > will create a products_export.pkl (necessary for testing Embeddings)

## Run Prompt Tests 
- `python main.py test-prompts.csv test-configs.csv test-survey.csv`
- `python main.py test-prompts-makesurvey.csv test-configs.csv`


#### Config Rules using Threads
| Model            | Executable | File Path           | Assistant                         | Vector Store                         | Code Interpreter              | 
|------------------|------------|---------------------|------------------------------|--------------------------------------|-------------------------------|
|                  | threads    | /path/products_export.json | yes,no, or ID of assistant to use | yes,no, or ID of vector store to use | yes,no |


#### Config Rules using Completions
| Model            | Executable  | File Path    |      everything else |
|------------------|-------------|----------|----------------------|
|                  | completions | /path/products_export.json | ignored              |



#### Config Rules using Embeddings
| Model            | Executable  | File Path    |      everything else |
|------------------|------------|----------|----------------------|
|                  | embeddings  | /path/products_export.json | ignored              |



## Compile results index file for interface:
`node results-indexer.js`

## Run interface to filter / sort / review results
- npm install
- npm start
- open http://localhost:3000/

--------

## DEV ROADMAP
- [ ] Parse and display survey better
- [ ] Map lookup source_id back to survey used
- [ ] Validate JSON response by reading requested format from instructions
- [ ] Optimize reuse to reduce token usage
- [ ] Merge data transformers (py and js) 
- [ ] Pass along Fine Tuning variables like `  temperature=1, max_tokens=256, top_p=1, frequency_penalty=0, presence_penalty=0`
