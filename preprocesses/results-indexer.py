import os
import json
import asyncio


async def get_top_level_properties(dir):
    files = os.listdir(dir)
    json_files = [file for file in files if file.endswith('.json')]

    results = []
    columns = {}

    for filename in json_files:
        file_path = os.path.join(dir, filename)
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
    async with aiofiles.open('../src/schema.json', 'w', encoding='utf-8') as f:
        await f.write(field_schema)

    return results


def make_label(field_name):
    if field_name == 'num_response':
        return 'Responses'

    str_ = field_name.replace('num_', '').replace('_id', '').replace('_time', '')
    words = re.split(r'(?=[A-Z])|_', str_)

    # Capitalize the first letter of each word and join them with spaces
    return ' '.join(word.capitalize() for word in words)


def add_column(val, key):
    column = {
        'field': key,
        'headerName': make_label(key),
        'type': type(val).__name__,
        'sortable': True,
        'filterable': True
    }
    if key in ['started', 'ended']:
        column['showing'] = False

    if column['type'] == 'str':
        if '_ids' in key:
            column['type'] = 'array'
            column['filterable'] = False
        elif isinstance(val, str) and not isNaN(parse_date(val)):
            column['type'] = 'time'
            column['filterable'] = False
    else:
        if column['type'] != 'dict':
            column['filterable'] = False

        # if column['type'] == 'dict':
        #     column['style'] = {'flexGrow': 1, 'wordBreak': 'break-word'}

    return column


def isNaN(value):
    try:
        float(value)
        return False
    except ValueError:
        return True


def parse_date(date_string):
    from dateutil.parser import parse
    try:
        return parse(date_string)
    except ValueError:
        return None


# Usage example:
directory_path = '../public/results'


async def main():
    result = await get_top_level_properties(directory_path)
    print('Top-level properties from JSON files:', result)
    json_string = json.dumps(result, indent=2)  # Pretty-print with 2-space indentation
    async with aiofiles.open('../public/results.json', 'w', encoding='utf-8') as f:
        await f.write(json_string)


if __name__ == '__main__':
    import aiofiles
    import re

    asyncio.run(main())
