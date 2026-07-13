from pydantic import BaseModel
from typing import Literal, Optional

# ---------------------------------------------------------------------------
# Request models (what the Angular app sends)
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    question: str


class PlayRequest(BaseModel):
    description: str  # e.g. "Generate a pick-and-roll play from the top of the key"
    num_players: int = 5
    court_mode: Literal["half", "full"] = "half"


# ---------------------------------------------------------------------------
# Play editor data contract — mirrors PlayEditorPersistedState in the Angular app
# ---------------------------------------------------------------------------

class Point(BaseModel):
    x: float
    y: float


class PlayerToken(BaseModel):
    id: str                          # e.g. "offense-1", "defense-X"
    type: Literal["offense", "defense"]
    label: str                       # player number shown on the token
    position: Point


class StoredPath(BaseModel):
    ownerId: str                     # which token is moving
    actionType: Literal["dribble", "pass", "cut", "screen", "dribble-handoff", "shoot"]
    points: list[Point]              # waypoints along the movement
    targetId: str | None = None      # used for passes (the receiving player's id)


class Phase(BaseModel):
    playerPositions: dict[str, Point]   # maps token id → position at start of this phase
    ballCarrierId: str | None
    paths: list[StoredPath]


class PlayEditorState(BaseModel):
    """
    The full canvas state the Angular play editor expects.
    This is stored JSON-stringified in the plays.canvas_state DB column.
    """
    tokens: list[PlayerToken]
    phases: list[Phase]
    ballCarrierId: str | None
    currentPhaseIndex: int
    currentPhasePaths: list[StoredPath]
    courtMode: Literal["half", "full"]


# ---------------------------------------------------------------------------
# Response models (what the server returns)
# ---------------------------------------------------------------------------

class QueryResponse(BaseModel):
    answer: str
    sources: list[str]    # excerpts of the knowledge chunks that were used


class PlayResponse(BaseModel):
    name: str
    description: str
    play: PlayEditorState


# ---------------------------------------------------------------------------
# Chat models — conversational AI coach
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class RosterPlayer(BaseModel):
    name: str
    position: str
    number: int
    role: Optional[str] = None       # star | starter | bench | deep_bench
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    notes: Optional[str] = None


class ChatRequest(BaseModel):
    history: list[ChatMessage]
    message: str
    roster: list[RosterPlayer]
    court_mode: str = 'half'
    current_play: Optional[PlayEditorState] = None


class ChatResponse(BaseModel):
    type: str  # 'question' | 'play'
    message: str
    play: Optional[PlayEditorState] = None
    options: Optional[list[str]] = None  # clickable chips for multiple-choice questions
