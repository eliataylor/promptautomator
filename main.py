import os
import asyncio
from dotenv import load_dotenv
from Recommender import Recommender
from itertools import product
import csv
import sys
from collections import namedtuple
import re

load_dotenv()

def sanitize_header(header):
    # Convert header to lowercase and replace non-alphanumeric characters with underscores
    return re.sub(r'\W|^(?=\d)', '_', header.lower())

def cast_to_boolean(value):
    if value in ['false', '0', '']:
        return False
    elif value in ['true', '1', '-1']:
        return True
    return value

def read_csv(file_path):
    try:
        with open(file_path, newline='') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)
            headers = [sanitize_header(header) for header in headers]
            Row = namedtuple('Row', headers)
            rows = []
            for row in reader:
                # Cast each value to boolean if it's a boolean-like value
                cleanrow = Row(*[cast_to_boolean(value) for value in row])
                rows.append(cleanrow)
            return rows

    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        sys.exit(1)


def build_survey(csv_file_path):
    try:
        with open(csv_file_path, newline='') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)  # Get the headers
            headers = [sanitize_header(header) for header in headers]

            data = list(reader)  # Read the remaining rows

            questions = [row[0] for row in data]  # Get the list of questions from the first column
            question_answers_array = []

            # Loop over the remaining columns
            for col_index in range(1, len(headers)):
                question_answers = {}
                for row_index in range(len(data)):
                    question = questions[row_index]
                    answer = data[row_index][col_index]
                    question_answers[question] = answer
                question_answers_array.append(question_answers)

            return question_answers_array
    except Exception as e:
        print(f"Error reading {csv_file_path}: {e}")
        return []


async def main():
    if len(sys.argv) < 3:
        print("Usage: python test.py <prompt_csv> <config_csv> <survey_csv>")
        sys.exit(1)

    prompt_csv = read_csv(sys.argv[1])
    config_csv = read_csv(sys.argv[2])

    if len(sys.argv) > 3:
        survey_json = build_survey(sys.argv[3])
    else:
        survey_json = [False]

    tasks = []
    for prompt, config, survey in product(prompt_csv, config_csv, survey_json):
        recommender = Recommender(prompt, config, survey)
        tasks.append(recommender.complete())

    # Run the asynchronous event loop
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
