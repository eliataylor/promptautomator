## A tool to automate testing and comparison OpenAI prompts, configurations, and responses  

> ### To speed up development consider [sponsoring this project](https://github.com/sponsors/eliataylor)

![interface.png](public%2Finterface.png)
view demo: https://promptautomator.taylormadetraffic.com

## Environment Setup 
- `git clone git@github.com:eliataylor/presideo-prompter.git`
- `cp .env.public .env`
- update your `.env` file your OpenAI key
- `python3.9 -m venv .venv`
- `source .venv/bin/activate`
- `pip install -r requirements.txt`

## Pull latest opensource from Prompt Automater
- `git remote add upstream git@github.com:eliataylor/promptautomator.git`
- `git fetch upstream`
- `git merge upstream/master`
- `git push origin master`

## Run [Demo](https://promptautomator.taylormadetraffic.com):
To navigate the interface and review results from testing this example dataset for writing playlists and playlists themes:
- `npm install --force`
- `npm start`
- `open http://localhost:3000/`

---
## To index and test your own data:

> #### Use this [Google Sheet](https://docs.google.com/spreadsheets/d/1xK9i_Qh_J1kbAMlPSlXf7nrT1HRV3RXzcq_0dmqPgNI/edit#gid=1914178484) 

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
- Set the file path to any data set optionally referenced in your prompt. Embeddings requires a .pkl file. All others currently require a .json file. You can use `indexer.py`  to convert them from CSVs
- Columns D-G only apply to "Thread" executables since Assistants can be built to these tools collectively and individually. After your first run, the results will include IDs for the columns enabled. For example, `asst-###`, `file_###`, `vs-###`. To speed up further tests and reduce API usage, change these Columns to the IDs created during each run. 
- Set your Fine-Tuning configs to be passed directly into the prompt


4. Export each CSV sheet to `bags/[sheetname].csv` 

5. Index your surveys for the React app to display: `python indexer.py index_surveys dataset/bags-userdata.csv `

## Normalize your dataset
-[x] Clean up the Shopify data (this replaces `normalize_dataset` from the public repo)
- `node preprocesses/shopify-cleaner.js dataset/bags.csv`

-[x] If testing Embeddings, convert your JSON to a PKL:  
`python indexer.py build_embeddings public/bags.json`

## Run Prompt Tests 
- [x] To run all prompts, against all configurations, against all userdata sets: 
- `python main.py dataset/bags-prompts.csv dataset/bags-configs.csv dataset/bags-userdata.csv`
- [x] To copy the individual results into a single index file for the front-end to load: 
- `python indexer.py index_results`
