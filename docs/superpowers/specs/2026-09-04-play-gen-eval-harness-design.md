# Play-Generation Eval Harness — Design

## Context

`rag-server/src/play_generator.py` already validates its own output on every
request: `_validate_geometry` (rule-based spacing/bounds/schema checks) and
`_critique_play` (an LLM critique of concept match, screen completeness,
phase chaining, ball-carrier handoff) run inside `handle_generate_play`'s
2-attempt retry loop. What's missing is any *aggregate, repeatable* signal —
today the only way to judge play-gen quality is to generate plays by hand in
the app and eyeball them. Any change to the prompt, the retrieval context,
the model, or the retry strategy is unmeasurable.

This is ROADMAP.md backlog item #4, flagged as the prerequisite for all
other play-gen quality work (#5 gold play library, #7 zone→coordinate
compiler, #9 targeted repair loop) — "without it, tuning is blind."

## Goals

- Score `/generate-play` end-to-end output quality across a representative
  set of ~30 play requests spanning the play families the knowledge base
  covers.
- Reuse the existing validation logic (geometry rules + Haiku critique)
  rather than inventing a new judge — the bar for "valid" stays consistent
  between production and eval.
- One command, human-readable report, runnable by a developer between
  changes to compare before/after by hand.

## Non-goals (this pass)

- **Retrieval quality** (`/query` hit-rate against a gold question set) —
  same pattern could extend to this later, deliberately deferred so this
  harness ships focused and fast.
- **`/chat` scoring** — open-ended conversational output isn't structured
  JSON like a play; no objective pass/fail signal without new machinery.
- **Persistent cross-run history / regression trend tracking** — each run
  produces one report; comparing two runs is a manual diff for now.
- **CI integration** — a manual dev-invoked script, not a merge gate.

## Architecture

A new `rag-server/eval/` package, siblings to `src/` (request handling) and
`data/` (knowledge base). It calls the real `handle_generate_play()` entry
point end-to-end — the same function `/generate-play` uses — so it measures
exactly what a client receives, including the existing retry behavior. It
then independently re-validates the returned play using the same checks
`handle_generate_play` already runs internally, via a newly-extracted shared
function.

```
rag-server/
  src/
    play_generator.py   # + new public validate_play()
  eval/
    __init__.py
    test_cases.py        # ~30 categorized play requests
    run_eval.py           # runner: generate -> validate -> report
    reports/               # git-ignored; one timestamped .md per run
```

## Components

### 1. `play_generator.py` — extract `validate_play`

`handle_generate_play`'s loop currently computes
`geo_issues = _validate_geometry(play_state)` and
`semantic_issues = _critique_play(request.description, data)` inline, then
concatenates them. Extract this into:

```python
def validate_play(description: str, data: dict, play_state: PlayEditorState) -> list[str]:
    return _validate_geometry(play_state) + _critique_play(description, data)
```

`handle_generate_play` calls this instead of the two checks inline — no
behavior change in production. The eval harness imports this one public
function instead of reaching into `_validate_geometry` / `_critique_play`
directly. Single source of truth for "what counts as a valid play."

### 2. `eval/test_cases.py`

A plain list of dataclass instances, no JSON — easiest to author with
inline comments, no serialization layer needed:

```python
@dataclass
class TestCase:
    id: str
    category: str
    description: str
    court_mode: Literal["half", "full"] = "half"
```

~30 cases, categorized to mirror `data/raw/set_plays_*` coverage:

| Category | Count |
|---|---|
| BLOB | 4 |
| SLOB | 3 |
| ATO (after timeout) | 3 |
| Horns | 2 |
| Floppy | 2 |
| Elevator | 2 |
| DHO | 2 |
| Motion-5 | 2 |
| Pick-and-roll (top/side) | 2 |
| Zone offense (2-3, 1-3-1) | 2 |
| Roster variation (post-heavy vs. perimeter-heavy) | 2 |
| Level segmentation (youth vs. competitive) | 2 |
| Edge cases (terse one-line asks, unusual requests) | 2 |
| **Total** | **30** |

Descriptions are written the way a coach would phrase a request (matching
real `/generate-play` input), not knowledge-base prose.

### 3. `eval/run_eval.py`

- Loads `TEST_CASES` from `test_cases.py`.
- Runs them through a `ThreadPoolExecutor(max_workers=5)` — 30 sequential
  Sonnet calls (up to 2 attempts each, 8192 max tokens) would be too slow
  one at a time; the Anthropic client is synchronous so threads (not
  asyncio) are the simple fit.
- Per case: call `response = handle_generate_play(PlayRequest(description=..., court_mode=...))`,
  then `validate_play(description, response.model_dump(), response.play)` — `response.model_dump()`
  is already the exact `{"name", "description", "play"}` shape `_critique_play` expects.
- A case **passes** iff `validate_play` returns an empty list — the same
  binary bar `handle_generate_play` uses to decide whether to retry.
- Prints a console summary and writes one timestamped Markdown report to
  `eval/reports/`.

### 4. Report format

```markdown
# Play-Gen Eval Report — 2026-09-04 14:32:10
Model: claude-sonnet-4-6 (generation) / claude-haiku-4-5-20251001 (critique)
Result: 24 / 30 passed (80%)

## By category
| Category | Passed | Total |
|---|---|---|
| BLOB | 3 | 4 |
| ...

## Failures
### slob-02 (SLOB) — "Quick corner three off a stagger inbound"
- Phase 2: playerPositions missing {'offense-4'}
- CONCEPT MATCH: inbounder placed at x=280,y=255 — must be on a sideline (y=0 or y=510) for a SLOB
```

Only failing cases get full detail (passing cases just count toward the
summary/category table) — keeps the report readable at 30 cases.

## Error handling

A case that raises (API error, or still-malformed JSON/schema after
`handle_generate_play`'s own 2 attempts) is caught at the per-case level,
recorded as a failure with the exception message as its sole "issue," and
the run continues. One bad case never aborts the suite.

## Cost & ops

Running the full 30-case suite makes real Anthropic API calls — roughly
30-60 Sonnet generations plus up to 30-60 Haiku critique calls (mirroring
`handle_generate_play`'s own retry budget). This has a real dollar cost.
Before treating the harness as done, it gets smoke-tested with 2-3 cases;
the full 30-case run happens by explicit choice, not automatically.

## How to run

```
cd rag-server
python -m eval.run_eval
```

Requires the same `.env` (`ANTHROPIC_API_KEY`) as the server itself — no
new configuration.

## Testing

The harness *is* a test tool; it's validated by running it, not by a
separate unit-test layer. Smoke-test with 2-3 cases (one clean pass-shaped
case, one that's known to stress the geometry/critique checks) before
running the full suite.

## Future extensions (explicitly deferred, not designed here)

- Retrieval-quality scoring for `/query` (same pattern: gold question set +
  reused validation).
- Persistent history so runs can be compared automatically instead of by
  hand.
- Feeding this harness's failure categories back into ROADMAP #5 (gold play
  library) and #7 (zone→coordinate compiler) prioritization.
