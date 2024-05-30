## Environment Setup 
- `git clone git@github.com:eliataylor/presideo-prompter.git`
- create `.env` file with `OPENAI_KEY=you-api-key`
- `python3.9 -m venv .venv`
- `source .venv/bin/activate`
- `pip install -r requirements.txt`

## Pull latest opensource from Prompt Automater
- `git remote add upstream git@github.com:eliataylor/promptautomator.git`
- `git fetch upstream`
- `git merge upstream/master`
- `git push origin master`

## Run Demo:
To navigate the interface and review results from testing this example dataset for writing playlists and playlists themes:
- `npm install --force`
- `npm start`
- `open http://localhost:3000/`

---
## To index and test your own data:

> #### Use this [Google Sheet](https://docs.google.com/spreadsheets/d/1xK9i_Qh_J1kbAMlPSlXf7nrT1HRV3RXzcq_0dmqPgNI/edit?usp=sharing) 

1. Reuse the "Prompts" sheet:
- Give your AI a persona in the Instructions column, 
- Write your prompt in the Prompt column. 
- Describe the expected response structure in the Response colum.
- Group your Prompt tests by setting any value in Prompt ID column.

The following tokens will be replaced as described:
> - `__FILENAME__` gets replaced with the Survey Data Answers
> - `__USERDATA__` gets replaced with the Survey Data Answers
> - `__RFORMAT__` gets replaced with your desired response structure 

2. Reuse the "Survey Answers" sheet:
- Write the Questions down the Rows and add responses to questions along Columns. Question-Answers will be grouped into a paragraph during testing. 

3. Reuse the "Configs" sheet:
- Selected any text based Model from OpenAI's list
- Select which Executable. See below 
- Set the file path to any data set optionally referenced in your prompt. Embeddings requires a .pkl file. All others currently require a .json file. You can use `DataIndexer.py`  to convert them from CSVs
- Columns D-G only apply to "Thread" executables since Assistants can be built to these tools collectively and individually. After your first run, the results will include IDs for the columns enabled. For example, `asst-###`, `file_###`, `vs-###`. To speed up further tests and reduce API usage, change these Columns to the IDs created during each run. 
- Set your Fine-Tuning configs to be passed directly into the prompt


**4. Export each CSV sheet to `yourfolder/[sheetname].csv`** 


## Normalize your dataset
-[x] Convert your CSV to JSON and replace your internal name for ID with `source_id`: 
  - python indexer.py normalize_dataset <path to your dataset file> <property name for your internal ID>
- `python indexer.py normalize_dataset dataset/bags.json source_id`


-[x] If testing Embeddings, convert your JSON to a PKL:  
`python indexer.py build_embeddings public/bags.json`

## Run Prompt Tests 
- [x] To run all prompts, against all configurations, against all userdata sets: 
- `python main.py dataset/bags-prompts.csv dataset/bags-configs.csv dataset/bags-userdata.csv`
- [x] To copy the individual results into a single index file for the front-end to load: 
- `python indexer.py index_results`

--------

## DEV ISSUES / ROADMAP
- [ ] Parse and display survey better
- [ ] Map lookup source_id back to survey used
- [ ] Validate JSON response by reading requested format from instructions
- [ ] Don't create embeddings on numeric only values or add currency symbol
- [ ] Optimize reuse to reduce token usage
- [ ] Pass along Fine-Tuning variables like `{temperature:1, max_tokens:256, top_p:1, frequency_penalty:0, presence_penalty:0}`
- [ ] Fix "Could not validate from dataset 'utf-8' codec can't decode byte 0x80 in position 0: invalid start byte"