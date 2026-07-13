import anthropic
from src.config import ANTHROPIC_API_KEY, QUERY_MODEL
from src.vector_store import retrieve
from src.models import QueryRequest, QueryResponse

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

_SYSTEM_PROMPT = """You are an expert basketball coaching assistant.
Answer the coach's question using only the knowledge provided below.
If the knowledge does not contain enough information to answer, say so clearly.
Be concise and practical — coaches need actionable advice."""


def handle_query(request: QueryRequest) -> QueryResponse:
    sources = retrieve(request.question, k=5)

    # Build a single block of context from the retrieved chunks
    context = "\n\n---\n\n".join(sources)

    message = _client.messages.create(
        model=QUERY_MODEL,
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Knowledge:\n{context}\n\nQuestion: {request.question}",
            }
        ],
    )

    answer = message.content[0].text
    return QueryResponse(answer=answer, sources=sources)
