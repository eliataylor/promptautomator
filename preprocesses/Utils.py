import csv
import fnmatch
import hashlib
import json
import os
import re
import sys

from dateutil.parser import parse


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


def convert_to_number(s):
    try:
        return int(s)
    except ValueError:
        try:
            return float(s)
        except ValueError:
            return s

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



def find_id_property(d):
    pattern = re.compile(r'(?i)(^|[^a-zA-Z0-9])id($|[^a-zA-Z0-9])', re.IGNORECASE)
    for key in d.keys():
        if pattern.search(key):
            return key
    return None

def get_nested(data, keys, default=None):
    """
    Safely get a nested value from a dictionary.

    :param data: The dictionary to search.
    :param keys: A list of keys to navigate through the dictionary.
    :param default: The default value to return if any key is not found.
    :return: The value found at the nested key, or default if any key is not found.
    """
    for key in keys:
        if isinstance(data, dict):
            data = data.get(key, default)
        else:
            return default
    return data

def find_json(string):
    start_index = min(string.find('{'), string.find('['))
    if start_index == -1:
        print('No JSON object found in the string.')
        return None
    end_char = ']' if string[start_index] == '[' else '}'
    end_index = string.rfind(end_char)
    if end_index == -1:
        print('Invalid JSON object format.')
        return None
    json_string = string[start_index:end_index + 1]
    try:
        json_object = json.loads(json_string)
        return json_object
    except json.JSONDecodeError as e:
        print('Error parsing JSON:', json_string, e)
        return None



def make_test_id(input_string):
    sha256_hash = hashlib.sha256(input_string.encode())
    checksum = sha256_hash.hexdigest()
    return checksum

""" Calculates and return Adler32 checksum """
def adler32(data):
    mod = 65521
    a = 1
    b = 0

    for char in data:
        a = (a + ord(char)) % mod
        b = (b + a) % mod

    return str((b << 16) | a)

def reconstruct_object(flat_object, order):
    reconstructed_object = {}
    for key in order:
        if key in flat_object:
            reconstructed_object[key] = flat_object[key]
    for key, value in flat_object.items():
        if key not in reconstructed_object:
            reconstructed_object[key] = value
    return reconstructed_object


def stringify_survey(survey):
    if not survey:
        return False
    lines = []
    for question, answer in survey.items():
        lines.append(f"{question}: {answer}")
    return "\n".join(lines)


def make_label(field_name):
    if field_name == 'prompt_id':
        return 'Prompt ID'

    str_ = field_name.replace('num_', '').replace('_id', '').replace('_time', '')
    words = re.split(r'(?=[A-Z])|_', str_)

    # Capitalize the first letter of each word and join them with spaces
    return ' '.join(word.capitalize() for word in words)

def check_type(variable):
    if isinstance(variable, (int, float)):
        return "number"
    elif isinstance(variable, str):
        return "string"
    elif callable(variable):
        return "function"
    else:
        return "object"



def parse_date(date_string):
    if isinstance(date_string, str) is False:
        return None
    try:
        return parse(date_string)
    except ValueError:
        return None


def find_nearby_file(filename, base_dir):
    skips = ['dist', 'node_modules', 'vendor', 'build', "__pycache__"]

    for root, dirnames, filenames in os.walk(base_dir):
        # Filter out hidden directories and directories in the skips list
        dirnames[:] = [d for d in dirnames if not d.startswith('.') and d not in skips]

        for name in fnmatch.filter(filenames, filename):
            return os.path.join(os.path.abspath(root), name)

    return None
