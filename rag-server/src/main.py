from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.models import QueryRequest, QueryResponse, PlayRequest, PlayResponse, ChatRequest, ChatResponse
from src.query_handler import handle_query
from src.play_generator import handle_generate_play
from src.chat_handler import handle_chat

app = FastAPI(title="CoachDiary RAG Server", version="1.0.0")

# Allow the Angular app (and future mobile app) to call this server from any origin.
# In production you can tighten this to your specific domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest) -> QueryResponse:
    """Answer a free-text basketball question using the knowledge base."""
    try:
        return handle_query(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-play", response_model=PlayResponse)
def generate_play(request: PlayRequest) -> PlayResponse:
    """Generate a structured play in PlayEditorState format."""
    try:
        return handle_generate_play(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Conversational AI coach — asks follow-up questions then auto-generates a play."""
    try:
        return handle_chat(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
