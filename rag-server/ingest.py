"""
Basketball knowledge ingestion script.

Usage:
    python ingest.py

What it does:
1. Reads all .pdf and .txt files from DATA_PATH (default: ./data/raw)
2. Splits them into overlapping chunks (so context is not cut off at boundaries)
3. Embeds each chunk with a local sentence-transformer model
4. Saves the embeddings into Chroma (persisted on disk at CHROMA_PATH)

Run this whenever you add new documents to ./data/raw.
The existing collection is cleared first so there are no duplicates.
"""

import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# Read config from .env (same as the server)
from dotenv import load_dotenv
load_dotenv()

CHROMA_PATH = os.getenv("CHROMA_PATH", "./data/chroma")
DATA_PATH = os.getenv("DATA_PATH", "./data/raw")
CHROMA_COLLECTION = "basketball_knowledge"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Chunk size: how many characters per chunk.
# Overlap: how many characters are shared between adjacent chunks (prevents cutting sentences).
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def load_documents(data_path: str) -> list:
    documents = []
    raw_dir = Path(data_path)

    if not raw_dir.exists():
        print(f"Data directory not found: {raw_dir.resolve()}")
        return documents

    for file in raw_dir.iterdir():
        if file.suffix.lower() == ".pdf":
            print(f"  Loading PDF: {file.name}")
            loader = PyPDFLoader(str(file))
            documents.extend(loader.load())
        elif file.suffix.lower() in (".txt", ".md"):
            print(f"  Loading {file.suffix[1:].upper()}: {file.name}")
            loader = TextLoader(str(file), encoding="utf-8")
            documents.extend(loader.load())

    return documents


def main():
    print("=== CoachDiary RAG — Knowledge Ingestion ===\n")

    print("Step 1: Loading documents from", DATA_PATH)
    documents = load_documents(DATA_PATH)
    if not documents:
        print("  No documents found. Add .pdf or .txt files to", DATA_PATH)
        return
    print(f"  Loaded {len(documents)} page(s) / document(s).\n")

    print("Step 2: Splitting into chunks...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(documents)
    print(f"  Created {len(chunks)} chunks.\n")

    print("Step 3: Loading embedding model (downloads once, ~80 MB)...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    print("  Model ready.\n")

    print("Step 4: Storing embeddings in Chroma at", CHROMA_PATH)
    # from_documents creates (or replaces) the collection in one call
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=CHROMA_COLLECTION,
        persist_directory=CHROMA_PATH,
    )
    print(f"  Done. {len(chunks)} chunks indexed.\n")
    print("Ingestion complete. You can now start the server.")


if __name__ == "__main__":
    main()
