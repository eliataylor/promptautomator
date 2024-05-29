from dotenv import load_dotenv
from preprocesses.Recommender import Recommender
from itertools import product
import csv
import sys
import asyncio
import re

load_dotenv()

def sanitize_header(header):
    # Convert header to lowercase and replace non-alphanumeric characters with underscores
    return re.sub(r'\W|^(?=\d)', '_', header.lower())

def cast_to_boolean(value):
    # Implement this function to cast 'true'/'false' like values to boolean
    true_values = ['true', 'yes', '1']
    false_values = ['false', 'no', '0']
    value_lower = value.lower()
    if value_lower in true_values:
        return True
    elif value_lower in false_values:
        return False
    return value

def read_csv(file_path):
    try:
        with open(file_path, newline='') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)
            headers = [sanitize_header(header) for header in headers]
            rows = []
            for row in reader:
                cleanrow = {header: cast_to_boolean(value) for header, value in zip(headers, row)}
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

    for prompt, config, survey in product(prompt_csv, config_csv, survey_json):
        recommender = Recommender(prompt, config, survey)
        await recommender.complete()


if __name__ == "__main__":
    asyncio.run(main())
