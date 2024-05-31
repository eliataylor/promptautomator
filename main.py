import asyncio
import sys, os
from itertools import product
from preprocesses.Prompter import Prompter
from preprocesses.Utils import read_csv, build_survey
from loguru import logger

logger.add("runnerlogs.log", level="DEBUG")
logger.add(sys.stdout, level="INFO")

def print_help():
    help_text = """
Usage: python main.py <prompt_csv> <config_csv> [<survey_csv>]

Arguments:
    <prompt_csv> : Path to the CSV file containing prompts.
    <config_csv> : Path to the CSV file containing configuration settings.
    [<survey_csv>] : (Optional) Path to the CSV file containing survey data.

Description:
    This script processes prompts and configuration settings from CSV files.
    If a survey CSV file is provided, it will also process survey data.
    """
    print(help_text)

async def main():
    if len(sys.argv) < 3:
        print_help()
        logger.critical("Insufficient arguments provided.")
        sys.exit(1)

    prompt_csv = read_csv(sys.argv[1])
    config_csv = read_csv(sys.argv[2])

    if len(sys.argv) > 3:
        if not os.path.exists(sys.argv[3]):
            logger.critical("No such file: " + sys.argv[3])
            sys.exit(1)
        survey_json = build_survey(sys.argv[3])
    else:
        survey_json = [False]

    for prompt, config, survey in product(prompt_csv, config_csv, survey_json):
        recommender = Prompter(prompt, config, survey) # WARN: arguments can be mutated inside.
        await recommender.complete()

if __name__ == "__main__":
    asyncio.run(main())
