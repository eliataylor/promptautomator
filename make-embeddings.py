from dotenv import load_dotenv
import sys
from preprocesses.Embeddings import Embeddings

load_dotenv()


def main():
    if len(sys.argv) != 3:
        print("Usage: python make-embeddings.py <product_file> <source_key>")
        sys.exit(1)

    Embeddings(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    main()
