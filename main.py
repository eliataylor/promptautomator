import asyncio
import sys
from itertools import product

from preprocesses.Prompter import Prompter
from preprocesses.Utils import read_csv, build_survey

async def main():


    if len(sys.argv) < 3:
        print("Usage: python main.py <prompt_csv> <config_csv> <survey_csv>")
        sys.exit(1)

    prompt_csv = read_csv(sys.argv[1])
    config_csv = read_csv(sys.argv[2])

    if len(sys.argv) > 3:
        survey_json = build_survey(sys.argv[3])
    else:
        survey_json = [False]

    for prompt, config, survey in product(prompt_csv, config_csv, survey_json):
        recommender = Prompter(prompt, config, survey)
        await recommender.complete()


if __name__ == "__main__":
    asyncio.run(main())
