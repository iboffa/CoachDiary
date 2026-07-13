import json
import math
import anthropic
from src.config import ANTHROPIC_API_KEY, GENERATION_MODEL, QUERY_MODEL
from src.vector_store import retrieve
from src.models import PlayRequest, PlayResponse, PlayEditorState

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Court dimensions (pixels) used by the Angular play editor
# Half court canvas is approximately 570 wide × 510 tall.
# The hoop is on the left side at x=54, y=255 (vertical center).
_HALF_COURT_INFO = """
Court coordinate system (half court):
- Canvas size: ~570 wide × 510 tall (pixels)
- Hoop position: x=54, y=255
- Y increases downward (top of screen = y=0, bottom = y=510)
- "north" = upper half of canvas (y < 255); "south" = lower half (y > 255)

CANONICAL ZONE COORDINATES — always use these exact values; never invent positions:
  Zone                    x     y
  ─────────────────────────────────
  Top of key            370   255   ← primary ball-handler position
  Wing north            330   113
  Wing south            330   398
  Corner north           87    73
  Corner south           87   438
  Elbow north           190   188
  Elbow south           190   323
  Low block north       145   188
  Low block south       145   323
  High post / FT line   280   255
  Short corner north    107   128
  Short corner south    107   383
  Paint center          122   255

Standard starting formations (copy these coordinates exactly):
  Five-out (perimeter spacing — maximum driving lanes):
    offense-1 (PG):  top of key       x=370, y=255
    offense-2 (SG):  wing north       x=330, y=113
    offense-3 (SF):  wing south       x=330, y=398
    offense-4 (PF):  corner north      x=87,  y=73
    offense-5 (C):   corner south      x=87,  y=438

  Horns set (two elbows, two corners):
    offense-1 (PG):  top of key       x=370, y=255
    offense-2 (SG):  corner north      x=87,  y=73
    offense-3 (SF):  corner south      x=87,  y=438
    offense-4 (PF):  elbow north      x=190, y=188
    offense-5 (C):   elbow south      x=190, y=323

  Four-out one-in (one post, four perimeter):
    offense-1 (PG):  top of key       x=370, y=255
    offense-2 (SG):  wing north       x=330, y=113
    offense-3 (SF):  wing south       x=330, y=398
    offense-4 (PF):  corner north      x=87,  y=73
    offense-5 (C):   low block south  x=145, y=323

OUT-OF-BOUNDS INBOUNDER POSITIONS — inbounder stands outside the court boundary:
  BLOB (Baseline Out of Bounds) — inbounder behind the baseline:
    Inbounder:  x=30, y=255   (centred; shift y north/south as needed)

  SLOB (Sideline Out of Bounds) — inbounder on the north OR south sideline (y=0 or y=510):
    North sideline near baseline:   x=150, y=0
    North sideline mid-range:       x=280, y=0
    North sideline wing-extended:   x=370, y=0
    South sideline near baseline:   x=150, y=510
    South sideline mid-range:       x=280, y=510
    South sideline wing-extended:   x=370, y=510
    NEVER place a SLOB inbounder at x=570 — that is the half-court line, not a sideline.
"""

_SYSTEM_PROMPT = f"""You are an expert basketball tactician.
Your job is to design a basketball play and return it as valid JSON.

{_HALF_COURT_INFO}

JSON schema you MUST follow exactly (no extra keys, no markdown):
{{
  "name": "string — short play name",
  "description": "string — brief tactical explanation",
  "play": {{
    "tokens": [
      {{ "id": "offense-1", "type": "offense", "label": "1", "position": {{"x": 0, "y": 0}} }}
    ],
    "phases": [
      {{
        "playerPositions": {{
          "offense-1": {{"x": 0, "y": 0}}
        }},
        "ballCarrierId": "offense-1",
        "paths": [
          {{
            "ownerId": "offense-1",
            "actionType": "dribble",
            "points": [{{"x": 0, "y": 0}}, {{"x": 5, "y": 5}}, {{"x": 10, "y": 10}}],
            "targetId": null
          }}
        ]
      }}
    ],
    "ballCarrierId": "offense-1",
    "currentPhaseIndex": 0,
    "currentPhasePaths": [],
    "courtMode": "half"
  }}
}}

SPACING RULES (critical — violating these makes the play unreadable):
- No two tokens may start within 80px of each other — EXCEPTION: two players forming a gate screen may be as close as 40px to each other (they are intentionally side-by-side), but all other players remain ≥ 80px from them
- Stagger screens do NOT need an exception — the two screeners sit at different depths (different x-values) and are naturally ≥ 80px apart
- Use the canonical zone coordinates above as your baseline — do not invent positions or cluster players
- Perimeter players must stay at x > 85; only post/paint actions go below x=85
- Corners: y≈73 (north) or y≈438 (south); wings: y≈113 (north) or y≈398 (south); top: y=255

PHASE RULES — split the play into 2–3 phases for clarity:
- Phase 1 — Setup: initial player movements (screens being set, cutters getting in position, ball-handler probing).
- Phase 2 — Main action: the core read (pick-and-roll turn corner, cutter uses screen, pass to the open player).
- Phase 3 — Conclusion (only if needed): finish (shot, drive, secondary pass, roll to basket).
  Simple plays (one clear action) use 2 phases. Complex plays (stagger, DHO, elevator) use 3.

How playerPositions chains between phases:
- tokens[].position  = where everyone starts (before Phase 1).
- phases[0].playerPositions = same as starting positions (copy them — Phase 1 begins here).
- phases[1].playerPositions = where each player ended up after Phase 1's paths finished.
- phases[2].playerPositions = where each player ended up after Phase 2's paths finished.
Every token must appear in every phase's playerPositions.

PATH RULES (keep paths short — 8192 token budget must cover all phases):
- Every path must have EXACTLY 3 waypoints (start, one mid-point, end) — no more, no fewer.
- Arc dribble drives — curve through the midpoint, do not draw straight lines.
- All waypoints must stay inside canvas bounds (x: 0–570, y: 0–510).
- A path's first waypoint must match the owner's position in that phase's playerPositions.

SCREEN PATH RULES — screens require TWO coordinated paths in the same phase:
  Screener path (actionType: "screen"):
    - Waypoints trace the screener's movement TO the screen-setting position.
    - The final waypoint IS the screen position — the screener stops there.
  Cutter path (actionType: "cut"):
    - First waypoint starts at or near the screener's final (screen) position.
    - Remaining waypoints trace the cutter curling away to their target spot.
  Screen geometry by type:
    Down screen  — screener moves toward the basket (decreasing x); cutter curls toward the arc (increasing x).
    Up screen    — screener moves away from basket (increasing x); cutter curls toward the paint (decreasing x).
    Back screen  — screener moves toward sideline; cutter curls toward the basket.
    Flare screen — screener moves toward the corner; cutter curls toward the corner/wing.
  Never omit the screener path. If a screen is described, both paths MUST appear.

BALL SCREEN (PICK-AND-ROLL) PATH RULES — different from off-ball screens:
  A pick-and-roll has the screener set a screen ON the ball-handler's defender, not on a cutter.
  The ball-handler is the one who uses the screen — they DRIBBLE through it, not cut.

  Phase 1 — Setup (screener moves to set the screen; ball-handler dribbles toward it):
    Screener (actionType: "screen"): moves from starting spot to the screen-setting position.
      Example top-of-key P&R: offense-5 moves from corner south [x=87,y=438] → [x=160,y=350] → [x=230,y=255].
    Ball-handler (actionType: "dribble"): dribbles from starting position toward the screen.
      Example: offense-1 moves from [x=370,y=255] → [x=310,y=255] → [x=255,y=255].
      The ball-handler's last waypoint must be BEHIND the screen (same side as the attack direction).

  Phase 2 — Action (ball-handler turns the corner; screener rolls or pops):
    Ball-handler (actionType: "dribble"): drives past/behind the screen toward the paint or pull-up spot.
      Turn-corner example: [x=255,y=255] → [x=190,y=220] → [x=130,y=188].
      Pull-up example: [x=255,y=255] → [x=220,y=255] → [x=200,y=255].
    Screener roll (actionType: "cut"): rolls hard to the basket.
      Example: [x=230,y=255] → [x=155,y=255] → [x=80,y=255].
    Screener pop (actionType: "dribble-handoff" or place at wing/corner via playerPositions, no path needed in phase 2 unless they receive a pass).

  Key rule: the ball-handler's dribble path MUST pass through or immediately behind the screen position, not stay at the top of the key. A P&R where the handler never moves toward the screen is broken.

TOKEN LABELS — always use positional slot numbers, never jersey numbers:
  offense-1 → label "1" (PG), offense-2 → label "2" (SG), offense-3 → label "3" (SF),
  offense-4 → label "4" (PF), offense-5 → label "5" (C).
  Ignore any jersey numbers mentioned in the description.

actionType must be one of: dribble, pass, cut, screen, dribble-handoff, shoot
For a pass, set targetId to the receiving player's id; all other paths set targetId to null.
targetId on a pass MUST be a different player's id — never equal to ownerId (no self-passes).
Generate EXACTLY 5 offensive tokens (offense-1 through offense-5) — no more, no fewer.
Do NOT generate any defense tokens or defense paths — offense only.
Return ONLY the JSON object, no explanation, no markdown code block.
"""


_CRITIQUE_SYSTEM = """You are a basketball play validator.
Given a play request and its generated JSON, find issues in these five areas only:

1. CONCEPT MATCH — does the play type, formation, and primary action match the request?
   (e.g. a SLOB request must have an inbounder on the sideline; a horns request must have elbow players)
2. PURPOSEFUL MOVEMENT — does every player path serve a clear tactical role?
   (spacing, screening, cutting, passing, shooting — flag any path that achieves nothing)
3. SCREEN COMPLETENESS — for every screen mentioned, is there BOTH a screener path (actionType=screen)
   AND a cutter path (actionType=cut) from a different player in the same phase?
4. PHASE CHAINING — does each player's position in phase N+1's playerPositions match the endpoint
   of their path in phase N? A player whose path ends at {x:130,y:188} must appear at {x:130,y:188}
   in the NEXT phase's playerPositions, not at their original starting position.
5. BALL CARRIER HANDOFF — after any pass path in phase N, does phase N+1's ballCarrierId equal the
   targetId of that pass? The ball cannot remain with the passer after a completed pass.

Return ONLY valid JSON — no explanation:
  {"valid": true}
or
  {"valid": false, "issues": ["concise issue 1", "concise issue 2"]}"""


def _validate_geometry(play: PlayEditorState) -> list[str]:
    """Rule-based checks that can be evaluated without an LLM."""
    issues = []
    token_ids = {t.id for t in play.tokens}
    offense_tokens = [t for t in play.tokens if t.type == "offense"]
    defense_tokens = [t for t in play.tokens if t.type == "defense"]

    if len(offense_tokens) != 5:
        issues.append(f"Expected 5 offense tokens, got {len(offense_tokens)}")
    if defense_tokens:
        issues.append(f"Found {len(defense_tokens)} defense token(s) — offense only")

    # Starting-position spacing
    for i, a in enumerate(offense_tokens):
        for b in offense_tokens[i + 1:]:
            d = math.dist((a.position.x, a.position.y), (b.position.x, b.position.y))
            if d < 40:
                issues.append(
                    f"Tokens {a.id} and {b.id} start only {d:.0f}px apart (minimum 40px)"
                )

    for pi, phase in enumerate(play.phases, 1):
        # playerPositions must cover every token
        missing = token_ids - set(phase.playerPositions.keys())
        if missing:
            issues.append(f"Phase {pi}: playerPositions missing {missing}")

        for path in phase.paths:
            # Owner must be a real token
            if path.ownerId not in token_ids:
                issues.append(f"Phase {pi}: path owner '{path.ownerId}' is not a token")

            # Self-pass
            if path.actionType == "pass":
                if path.targetId == path.ownerId:
                    issues.append(f"Phase {pi}: {path.ownerId} passes to itself")
                if path.targetId and path.targetId not in token_ids:
                    issues.append(
                        f"Phase {pi}: pass targetId '{path.targetId}' does not match any token"
                    )

            # Waypoint count
            if len(path.points) != 3:
                issues.append(
                    f"Phase {pi}, {path.ownerId}: {len(path.points)} waypoints (must be 3)"
                )

            # Bounds
            for wp in path.points:
                if not (0 <= wp.x <= 570 and 0 <= wp.y <= 510):
                    issues.append(
                        f"Phase {pi}, {path.ownerId}: waypoint ({wp.x:.0f},{wp.y:.0f}) out of bounds"
                    )

    return issues


def _critique_play(description: str, data: dict) -> list[str]:
    """Ask Haiku to check concept match, purposeful movement, and screen completeness."""
    play_json = json.dumps(data, indent=2)
    response = _client.messages.create(
        model=QUERY_MODEL,
        max_tokens=256,
        system=_CRITIQUE_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Play request: {description}\n\n"
                    f"Generated play JSON:\n{play_json}"
                ),
            }
        ],
    )
    raw = response.content[0].text.strip()
    try:
        result = json.loads(raw)
        if result.get("valid"):
            return []
        return result.get("issues", [])
    except json.JSONDecodeError:
        print(f"[generator] critique parse error, skipping: {raw[:200]}")
        return []


def _generate_raw(context: str, description: str, court_mode: str, prior_issues: list[str]) -> str:
    user_content = (
        f"Tactical knowledge:\n{context}\n\n"
        f"Generate a 5-player play for: {description}. "
        f"Court mode: {court_mode}."
    )
    if prior_issues:
        formatted = "\n".join(f"- {i}" for i in prior_issues)
        user_content += f"\n\nFix these issues from the previous attempt:\n{formatted}"

    message = _client.messages.create(
        model=GENERATION_MODEL,
        max_tokens=8192,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()
    return raw


def handle_generate_play(request: PlayRequest) -> PlayResponse:
    sources = retrieve(request.description, k=6)
    context = "\n\n---\n\n".join(sources)

    prior_issues: list[str] = []

    for attempt in range(2):
        print(f"[generator] attempt {attempt + 1}" + (f" — fixing {len(prior_issues)} issue(s)" if prior_issues else ""))
        raw = _generate_raw(context, request.description, request.court_mode, prior_issues)
        print(f"[generator] raw response length: {len(raw)}")

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"[generator] JSON parse error: {e}\nRaw:\n{raw[:500]}")
            if attempt == 0:
                prior_issues = [f"Response was not valid JSON: {e}"]
                continue
            raise

        try:
            play_state = PlayEditorState(**data["play"])
        except Exception as e:
            print(f"[generator] Pydantic validation error: {e}")
            if attempt == 0:
                prior_issues = [f"JSON schema error: {e}"]
                continue
            raise

        geo_issues = _validate_geometry(play_state)
        semantic_issues = _critique_play(request.description, data)
        all_issues = geo_issues + semantic_issues

        if all_issues:
            print(f"[generator] validation issues: {all_issues}")
            if attempt == 0:
                prior_issues = all_issues
                continue
            print("[generator] issues remain after retry — returning best effort")

        return PlayResponse(
            name=data["name"],
            description=data["description"],
            play=play_state,
        )

    raise RuntimeError("Play generation failed after 2 attempts")
