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

#### Config Rules using Threads
| Model            | Executable | File Path                    | Assistant                         | Vector Store                         | Code Interpreter              | 
|------------------|------------|------------------------------|------------------------------|--------------------------------------|-------------------------------|
|                  | threads    | examples/music-catalogue.csv | yes,no, or ID of assistant to use | yes,no, or ID of vector store to use | yes,no |


#### Config Rules using Completions
| Model            | Executable  | File Path    |      everything else |
|------------------|-------------|----------|----------------------|
|                  | completions | examples/music-catalogue.csv | ignored              |



#### Config Rules using Embeddings
- `python make-embeddings.py examples/music-catalogue.csv id` > will create "examples/music-catalogue.pkl" (necessary for testing Embeddings)

| Model            | Executable  | File Path    |      everything else |
|------------------|------------|----------|----------------------|
|                  | embeddings  | examples/music-catalogue.csv | ignored              |


## Run Prompt Tests 
- `python main.py examples/playlists-makeplaylists.csv examples/playlists-configs.csv examples/playlists-survey.csv`
- `python main.py examples/playlists-makethemes.csv examples/playlists-configs.csv`


## Compile results index file for interface:
`python preprocesses/results-indexer.py`

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
- [ ] Pass along Fine-Tuning variables like `  temperature=1, max_tokens=256, top_p=1, frequency_penalty=0, presence_penalty=0`
