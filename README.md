## A tool to automate testing and comparing ChatGPT responses based on variations in prompts and configurations   

---- 
<figure style="text-align: center;">
  <img src="public/presideo.svg" alt="Presideo Logo" height="50" >
</figure>

### Special Thanks to [Presideo Creative](https://presidiodev.com/) for [sponsoring this project](https://github.com/sponsors/eliataylor)

---

![interface.png](public%2Finterface.png)
view demo: https://promptautomator.taylormadetraffic.com

-----

## Environment Setup 
- `git clone git@github.com:eliataylor/promptautomator.git`
- `cd promptautomator`
- `cp .env.public .env`
- update your `.env` file your OpenAI key
- `python3.9 -m venv .venv`
- `source .venv/bin/activate`
- `pip install -r requirements.txt`


## Run [Demo](https://promptautomator.taylormadetraffic.com):
Review and compare results (preloaded with example dataset for writing playlists and playlists themes)
- `npm install`
- `npm start`
- `open http://localhost:3000/`

---
## To index and test your own data:

> #### Copy this [Google Sheet](https://docs.google.com/spreadsheets/d/1NZ9vNCUsZmTvA6byWalU6CAJfF8NIi5e4e9Z6tlw1mI/edit?usp=sharing) to your own account

1. Reuse the "Prompts" to list your prompts. The columns are: 
- _Instructions_: Give your AI a persona. 
- _Prompt_: Write your prompt. 
- _Response_: Your expected response structure
- _Prompt ID_: Any id to group prompts 

The following tokens will be replaced as described:
> - `__RFORMAT__` gets replaced with your desired response structure from your prompts sheet above
> - `__FILENAME__` gets replaced with your File Path below  
> - `__USERDATA__` gets replaced with each set of Survey Answers below 

2. Reuse the "Survey Answers" sheet:
- Write the Questions down the Rows and add responses to questions along Columns. Question-Answers will be grouped into a paragraph during testing. 

3. Reuse the "Configs" sheets. The columns are:
- _Model_: Selected any text based [OpenAIs Model](https://platform.openai.com/docs/models)
- _File Path_: Set the file path to any data set optionally referenced in your prompt. Embeddings requires a .pkl file. All others currently require a .json file OR a valid OpenAI file ID. You can use `indexer.py`  to convert them from CSVs
- _Fine Tuning_: Set your Fine-Tuning configs to be passed directly into the prompt
- _Executable_: Select which Executable. (Threads / Completion / Embeddings)
- _File Search_ / _Code Interpret_: True or False, only used in Threads
- _Assistant_ / _Vector Store_: True, False, or a valid OpenAI id to reuse. Setting an ID will speed up further tests and reduce API usage. 

4. Export each CSV sheet to `yourfolder/[sheetname].csv` 

5. Index your surveys for the React app to display: `python indexer.py index_surveys dataset/bags-userdata.csv`


## Normalize your dataset
- [x] Convert your CSV to JSON and replace your internal name for ID with `source_id`: 
  - python indexer.py normalize_dataset <path to your dataset file> <property name for your internal ID>
- `python indexer.py normalize_dataset examples/music-catalogue.csv id`


- [x] If testing Embeddings, convert your JSON to a PKL:  
- `python indexer.py build_embeddings public/music-catalogue.json`

## Run Prompt Tests 
- [x] To run all prompts, against all configurations, against all userdata sets: 
- `python main.py examples/music-catalogue-prompts.csv examples/music-catalogue-configs.csv examples/music-catalogue-userdata.csv`
- [x] To copy the individual results into a single index file for the front-end to load: 
- `python indexer.py index_results`

--------

## DEV ISSUES / ROADMAP
- [ ] Implement Code Interpreter
- [ ] Validate JSON response by reading requested format from instructions
- [ ] Optimize reuse to reduce token usage
- [ ] Pass along Fine-Tuning variables like `{temperature:1, max_tokens:256, top_p:1, frequency_penalty:0, presence_penalty:0}`
- [ ] Fix "Could not validate from dataset 'utf-8' codec can't decode byte 0x80 in position 0: invalid start byte"