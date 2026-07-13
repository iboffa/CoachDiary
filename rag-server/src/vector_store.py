from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from src.config import CHROMA_PATH, CHROMA_COLLECTION, EMBEDDING_MODEL

# Module-level singletons — created once when the server starts, reused on every request.
# This avoids reloading the embedding model (which takes ~1 second) on each call.
_embeddings: HuggingFaceEmbeddings | None = None
_store: Chroma | None = None


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _embeddings


def get_store() -> Chroma:
    global _store
    if _store is None:
        _store = Chroma(
            collection_name=CHROMA_COLLECTION,
            embedding_function=get_embeddings(),
            persist_directory=CHROMA_PATH,
        )
    return _store


def retrieve(query: str, k: int = 5) -> list[str]:
    """
    Find the k most relevant text chunks for a given query.
    Returns a list of plain text strings (the chunk contents).
    """
    results = get_store().similarity_search(query, k=k)
    return [doc.page_content for doc in results]
