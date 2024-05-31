from dotenv import load_dotenv
import asyncio
import os, sys
from preprocesses.DataIndexer import normalize_dataset, build_embeddings, index_results, index_surveys

load_dotenv()
from loguru import logger

logger.add("runnerlogs.log", level="DEBUG")
logger.add(sys.stdout, level="INFO")
load_dotenv()


if __name__ == '__main__':
    methods = ['index_surveys', 'normalize_dataset', 'build_embeddings', 'index_results']
    if sys.argv[1] not in methods:
        logger.critical(f"Invalid command {sys.argv[1]}: Try `python indexer.py normalize_dataset <product_file> <source_key>`")
        sys.exit(1)

    if sys.argv[1] == 'index_surveys':
        if not os.path.exists(sys.argv[2]):
            logger.critical("No such file: " + sys.argv[2])
            sys.exit(1)
        asyncio.run(index_surveys(sys.argv[2]))

    elif sys.argv[1] == 'index_results':
        # python preprocesses/DataIndexer.py index_results
        asyncio.run(index_results())

    else:
        if not os.path.exists(sys.argv[2]):
            logger.critical("No such file: " + sys.argv[2])
            sys.exit(1)

        if sys.argv[1] == 'normalize_dataset' and not sys.argv[3]:
            logger.critical("missing source id key name (id, product_id, ...?)")
            sys.exit(1)

        if sys.argv[1] == 'normalize_dataset':
            # python preprocesses/DataIndexer.py normalize_dataset examples/music-catalogue.csv id
            asyncio.run(normalize_dataset(sys.argv[2], sys.argv[3]))
        elif sys.argv[1] == 'build_embeddings':
            # python preprocesses/DataIndexer.py build_embeddings public/music-catalogue.json
            asyncio.run(build_embeddings(sys.argv[2]))



