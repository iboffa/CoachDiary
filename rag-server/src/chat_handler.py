import json
import anthropic
from src.config import ANTHROPIC_API_KEY, CHAT_MODEL
from src.vector_store import retrieve
from src.models import ChatRequest, ChatResponse, PlayEditorState, PlayRequest
from src.play_generator import handle_generate_play

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

_HALF_COURT_INFO = """
Court coordinate system (half court):
- Canvas size: ~570 wide x 510 tall (pixels)
- Hoop position: x=54, y=255
- Y increases downward (top = y=0, bottom = y=510)
- "north" = upper canvas (y < 255); "south" = lower canvas (y > 255)

Canonical five-out starting positions (use these exact values):
    offense-1 (PG, top of key):   x=370, y=255
    offense-2 (SG, wing north):   x=330, y=113
    offense-3 (SF, wing south):   x=330, y=398
    offense-4 (PF, corner north):  x=87,  y=73
    offense-5 (C,  corner south):  x=87,  y=438

Other key zones: elbow north x=190 y=188, elbow south x=190 y=323,
  low block north x=145 y=188, low block south x=145 y=323,
  high post x=280 y=255.

OUT-OF-BOUNDS INBOUNDER POSITIONS (inbounder stands outside the court):
  BLOB inbounder: x=30, y=255 (behind baseline; shift y for angle)
  SLOB inbounder: on the NORTH sideline (y=0) or SOUTH sideline (y=510) — NOT y=255.
    Near-baseline SLOB: x=150, y=0  or  x=150, y=510
    Mid-range SLOB:     x=280, y=0  or  x=280, y=510
    Wing-extended SLOB: x=370, y=0  or  x=370, y=510
  Always describe the inbounder with y=0 or y=510 for SLOBs, never y≈255.
- actionType must be one of: dribble, pass, cut, screen, dribble-handoff, shoot
- For a pass, set targetId to the receiving player's id
- Keep coordinates inside canvas bounds (x: 0-570, y: 0-510)
"""

# Static block: instructions + roster + court info — identical within a session, eligible for prompt caching.
_STATIC_SYSTEM_TEMPLATE = """You are an expert basketball coaching assistant embedded in CoachDiary, a play design app.

Your job is to help coaches design basketball plays through conversation AND to analyze plays already drawn on the canvas.

{roster_block}

{court_info}

--- INSTRUCTIONS ---

**Mode 1 — Generate a new play:**
You have the full roster above — use it. Silently consider each player's role (STAR > STARTER > BENCH > DEEP BENCH), position, strengths, and weaknesses to assign them to the best positional slot for the concept. Make confident coaching decisions and generate immediately.

Default assumptions (apply unless the coach says otherwise):
- Use all starters or the most tactically relevant players for the concept
- Assign the primary scoring action to the highest-hierarchy player whose skills fit the play
- Half-court set play unless the coach says fast break / transition / full court
- Man-to-man defensive context

If the coach names ANY play concept (pick-and-roll, motion, baseline cut, horns, flex, transition, BLOB, SLOB, etc.) — generate right away. Do NOT ask which players to use (use the roster), do NOT ask about the defensive scheme (assume man-to-man), and NEVER ask about coordinates, positions, zones, or any spatial placement — you describe the play in basketball terms (zones, roles, actions) and the engine handles all coordinates automatically. Ask ONE question only if the play concept itself is completely absent from the request.

If the coach asks to redraw, retry, or regenerate — look at the conversation history and the Current Canvas to identify the original play type, formation, and primary action, then regenerate keeping ALL of those constraints intact. A SLOB must stay a SLOB; a horns set must stay horns. Only change what the coach explicitly asked to change.

When ready to generate, respond ONLY with this JSON (no markdown, no extra text):
{{"type":"play","message":"<detailed prose description using only positional slots 1–5 (1=PG, 2=SG, 3=SF, 4=PF, 5=C) — no names, no jersey numbers — describing the formation, movement sequence, and tactical purpose>"}}

**Mode 2 — Analyze the current play:**
If the user asks to analyze, review, explain, or give feedback on the current play, and a play is shown in the Current Canvas section below, describe it in coaching terms: formations, sequences, reads, and tactical purpose. Use player labels from the roster when available.
You already have full canvas data in the Current Canvas section — NEVER tell the coach you need coordinates, live updates, or spatial data. NEVER mention "x/y values", "canvas", "coordinates", "pixels", "static data", or any technical term. You are a basketball coach, not a software system. Work with what you have and speak basketball.
Respond ONLY with this JSON (no markdown, no extra text):
{{"type":"question","message":"<your analysis>"}}

When asking a clarifying question, respond ONLY with this JSON (no markdown, no extra text):
{{"type":"question","message":"<your question>"}}

When the clarifying question has 2–4 distinct short choices, you MAY add an "options" array of concise labels so the coach can tap a chip instead of typing. Example:
{{"type":"question","message":"What formation do you want to start from?","options":["5-out","Horns","Elbow","Box"]}}
Only include "options" when the choices are truly discrete and exhaustive for the question. Omit it otherwise.
"""


_ROLE_LABELS = {
    "star":       "STAR",
    "starter":    "STARTER",
    "bench":      "BENCH",
    "deep_bench": "DEEP BENCH",
}


def _build_roster_block(roster: list) -> str:
    if not roster:
        return "Roster: (no players provided)"
    lines = ["Roster:"]
    for p in roster:
        role_tag = f" [{_ROLE_LABELS[p.role]}]" if getattr(p, "role", None) else ""
        lines.append(f"  #{p.number} {p.name} ({p.position}){role_tag}")
        if getattr(p, "strengths", None):
            lines.append(f"    Strengths: {p.strengths}")
        if getattr(p, "weaknesses", None):
            lines.append(f"    Weaknesses: {p.weaknesses}")
        if getattr(p, "notes", None):
            lines.append(f"    Notes: {p.notes}")
    return "\n".join(lines)


def _zone_name(x: float, y: float) -> str:
    """Map half-court pixel coordinates to a basketball zone label.
    Canvas: ~570 wide × 510 tall. Hoop at x=54, y=255. Y increases downward.
    """
    # Out-of-bounds inbounder positions — must be detected before any in-bounds logic
    if x < 40:
        return "inbounder (out of bounds, baseline — BLOB)"
    if y < 10:
        return "inbounder (out of bounds, north sideline — SLOB)"
    if y > 500:
        return "inbounder (out of bounds, south sideline — SLOB)"

    cy = 255.0
    side = "left" if y > cy else "right"
    dy = abs(y - cy)

    if x < 100:
        return "paint"
    if x < 200:
        if dy < 90:
            return f"low post {side}"
        return f"corner {side}"
    if x < 310:
        if dy < 90:
            return f"elbow {side}"
        return f"wing {side}"
    # beyond elbow extended / perimeter
    if dy < 70:
        return "top of the key"
    if dy < 160:
        return f"wing {side}"
    return f"corner {side}"


def _describe_play_state(play) -> str:
    """Convert a PlayEditorState into a human-readable coaching description."""
    lines = [f"Current canvas ({play.courtMode} court):"]

    offense = [t for t in play.tokens if t.type == "offense"]
    defense = [t for t in play.tokens if t.type == "defense"]

    if offense:
        lines.append("Offense: " + ", ".join(
            f"#{t.label} at {_zone_name(t.position.x, t.position.y)}" for t in offense
        ))
    if defense:
        lines.append("Defense: " + ", ".join(
            f"X at {_zone_name(t.position.x, t.position.y)}" for t in defense
        ))

    carrier = next((t for t in play.tokens if t.id == play.ballCarrierId), None)
    if carrier:
        lines.append(f"Ball carrier: #{carrier.label}")

    def _path_label(path, tokens):
        owner = next((t for t in tokens if t.id == path.ownerId), None)
        owner_s = f"#{owner.label}" if owner else path.ownerId
        if path.actionType == "pass" and path.targetId:
            target = next((t for t in tokens if t.id == path.targetId), None)
            target_s = f"#{target.label}" if target else path.targetId
            return f"{owner_s} passes to {target_s}"
        if path.actionType == "shoot":
            return f"{owner_s} shoots"
        return f"{owner_s} {path.actionType}s"

    if play.phases:
        lines.append(f"Phases ({len(play.phases)}):")
        for i, phase in enumerate(play.phases):
            descs = [_path_label(p, play.tokens) for p in phase.paths]
            lines.append(f"  Phase {i + 1}: " + ("; ".join(descs) if descs else "(no paths)"))

    if play.currentPhasePaths:
        descs = [_path_label(p, play.tokens) for p in play.currentPhasePaths]
        lines.append("Current phase (in progress): " + "; ".join(descs))

    return "\n".join(lines)


def handle_chat(request: ChatRequest) -> ChatResponse:
    sources = retrieve(request.message, k=6)
    knowledge = "\n\n---\n\n".join(sources) if sources else "(no relevant knowledge retrieved)"

    roster_block = _build_roster_block(request.roster)
    static_text = _STATIC_SYSTEM_TEMPLATE.format(
        roster_block=roster_block,
        court_info=_HALF_COURT_INFO,
    )

    # Two-block system prompt: static part is cache-eligible (roster + court info +
    # instructions never change within a session); knowledge block is dynamic per turn.
    system = [
        {
            "type": "text",
            "text": static_text,
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": f"Retrieved basketball knowledge:\n{knowledge}",
        },
    ]

    print(f"[chat] current_play present: {request.current_play is not None}, tokens: {len(request.current_play.tokens) if request.current_play else 0}")
    if request.current_play and request.current_play.tokens:
        play_description = _describe_play_state(request.current_play)
        print(f"[chat] injecting canvas:\n{play_description}")
        system.append({
            "type": "text",
            "text": f"--- Current Canvas ---\n{play_description}",
        })

    messages = []
    for msg in request.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": request.message})

    # Haiku handles the conversation — lightweight, cheap
    response = _client.messages.create(
        model=CHAT_MODEL,
        max_tokens=512,
        system=system,
        messages=messages,
        extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences — Haiku sometimes wraps JSON despite being told not to
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return ChatResponse(type="question", message=raw)

    response_type = data.get("type", "question")
    message = data.get("message", raw)

    if response_type == "play":
        # Haiku decided it has enough context. Hand the prose description to
        # handle_generate_play() so Sonnet produces the coordinate-precise JSON.
        try:
            play_response = handle_generate_play(
                PlayRequest(
                    description=message,
                    num_players=5,
                    court_mode=request.court_mode,
                )
            )
            return ChatResponse(type="play", message=message, play=play_response.play)
        except Exception as exc:
            import traceback
            traceback.print_exc()
            print(f"[chat] play generation failed: {exc}")
            return ChatResponse(
                type="question",
                message="I understood the play you want, but had trouble generating the coordinates. Please try again — you can add more detail or rephrase your description.",
            )

    options = data.get("options") or None
    return ChatResponse(type="question", message=message, options=options)
