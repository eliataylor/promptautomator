from dotenv import load_dotenv
import asyncio
import csv
import json
import os, sys
import shutil

import aiofiles

from Embeddings import Embeddings
from Utils import add_column, convert_to_number, sanitize_header, cast_to_boolean

load_dotenv()

async def build_embeddings(file_path):
    Embeddings(file_path)


async def index_results():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public/results'))
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
                results.append(top_level_properties)

    # columns.sort(key=lambda x: x.get('started'))

    field_schema = json.dumps(columns, indent=2)  # Pretty-print with 2-space indentation
    new_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src/schema.json'))
    async with aiofiles.open(new_path, 'w', encoding='utf-8') as f:
        await f.write(field_schema)

    json_string = json.dumps(results, indent=2)  # Pretty-print with 2-space indentation
    new_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/results.json'))
    async with aiofiles.open(new_path, 'w', encoding='utf-8') as f:
        await f.write(json_string)

    print('Results Index:', results)
    print('New Schema:', field_schema)


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

    if os.getenv("REACT_APP_DATASET_PATH"):
        new_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", os.getenv("REACT_APP_DATASET_PATH")))
        shutil.copy(file_path, new_path)


if __name__ == '__main__':
    if sys.argv[1] != 'normalize_dataset' and sys.argv[1] != 'build_embeddings' and sys.argv[1] != 'index_results':
        print(f"Invalid command {sys.argv[1]}: Try `python preprocesses/DataIndexer.py normalize_dataset <product_file> <source_key>`")
        sys.exit(1)

    if sys.argv[1] != 'index_results':
        if not os.path.exists(sys.argv[2]):
            print("No such file: " + sys.argv[2])
            sys.exit(1)

        if not sys.argv[3]:
            print("missing source id key name (id, product_id, ...?)")
            sys.exit(1)

    if sys.argv[1] == 'normalize_dataset':
        # python preprocesses/DataIndexer.py normalize_dataset examples/music-catalogue.csv id
        asyncio.run(normalize_dataset(sys.argv[2], sys.argv[3]))
    elif sys.argv[1] == 'build_embeddings':
        # python preprocesses/DataIndexer.py build_embeddings public/music-catalogue.json
        asyncio.run(build_embeddings(sys.argv[2]))
    elif sys.argv[1] == 'index_results':
        # python preprocesses/DataIndexer.py index_results
        asyncio.run(index_results())



