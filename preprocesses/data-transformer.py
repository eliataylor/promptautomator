from dotenv import load_dotenv
import sys
from Embeddings import Embeddings

load_dotenv()


def main():
    if len(sys.argv) != 2:
        print("Usage: python data-transformer.py <product_file>")
        sys.exit(1)

    product_file = sys.argv[1]
    Embeddings(product_file)


if __name__ == "__main__":
    main()
