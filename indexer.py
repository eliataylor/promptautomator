from dotenv import load_dotenv
import asyncio
import os
import sys
from preprocesses.DataIndexer import normalize_dataset, build_embeddings, index_results, index_surveys
from loguru import logger

load_dotenv()

logger.add("runnerlogs.log", level="DEBUG")
logger.add(sys.stdout, level="INFO")

def print_help():
    help_text = """
Usage: python indexer.py <command> [arguments]

Commands:
    index_surveys <survey_file>
        Description: Index survey data.
        Arguments:
            <survey_file> : Path to the survey file to index.

    normalize_dataset <product_file> <source_key>
        Description: Normalize the dataset.
        Arguments:
            <product_file> : Path to the product file to normalize.
            <source_key>   : Source key for normalization (e.g., id, product_id).

    build_embeddings <data_file>
        Description: Build embeddings from the dataset.
        Arguments:
            <data_file> : Path to the data file to build embeddings from.

    index_results
        Description: Index results.
        Arguments: None
    """
    print(help_text)

if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ['index_surveys', 'normalize_dataset', 'build_embeddings', 'index_results']:
        print_help()
        logger.critical(f"Invalid command: {sys.argv[1] if len(sys.argv) > 1 else ''}")
        sys.exit(1)

    command = sys.argv[1]

    if command == 'index_surveys':
        if len(sys.argv) < 3 or not os.path.exists(sys.argv[2]):
            logger.critical("No such file: " + (sys.argv[2] if len(sys.argv) > 2 else ''))
            sys.exit(1)
        asyncio.run(index_surveys(sys.argv[2]))

    elif command == 'normalize_dataset':
        if len(sys.argv) < 4:
            logger.critical("Missing arguments: <product_file> and/or <source_key>")
            print_help()
            sys.exit(1)
        if not os.path.exists(sys.argv[2]):
            logger.critical("No such file: " + sys.argv[2])
            sys.exit(1)
        asyncio.run(normalize_dataset(sys.argv[2], sys.argv[3]))

    elif command == 'build_embeddings':
        if len(sys.argv) < 3 or not os.path.exists(sys.argv[2]):
            logger.critical("No such file: " + (sys.argv[2] if len(sys.argv) > 2 else ''))
            sys.exit(1)
        asyncio.run(build_embeddings(sys.argv[2]))

    elif command == 'index_results':
        asyncio.run(index_results())
