import os
from dotenv import load_dotenv

load_dotenv()

# Anthropic API key — required for all generation calls
ANTHROPIC_API_KEY: str = os.environ["ANTHROPIC_API_KEY"]

# Paths
CHROMA_PATH: str = os.getenv("CHROMA_PATH", "./data/chroma")
DATA_PATH: str = os.getenv("DATA_PATH", "./data/raw")

# Claude model for play generation — needs strong structured-output and spatial reasoning
GENERATION_MODEL: str = os.getenv("GENERATION_MODEL", "claude-sonnet-4-6")

# Claude model for Q&A and chat conversation turns — lighter task, cheaper model is fine
QUERY_MODEL: str = os.getenv("QUERY_MODEL", "claude-haiku-4-5-20251001")
CHAT_MODEL: str = os.getenv("CHAT_MODEL", "claude-haiku-4-5-20251001")

# Local sentence-transformer model used to embed text into vectors.
# "all-MiniLM-L6-v2" is small (~80 MB), fast, and works offline — no extra API key needed.
EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

# Name of the Chroma collection that holds the basketball knowledge vectors
CHROMA_COLLECTION: str = "basketball_knowledge"
