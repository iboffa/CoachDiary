# Play-Generation Eval Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `rag-server` a repeatable way to score `/generate-play` output quality across ~30 categorized play requests, reusing the existing geometry validator and Haiku critique, so future prompt/retrieval/model changes are measurable instead of blind.

**Architecture:** A new `rag-server/eval/` package drives the real `handle_generate_play()` entry point end-to-end (same code path `/generate-play` uses, including its existing 2-attempt retry), then independently re-validates the result through a newly-extracted `validate_play()` shared with production code. Results are formatted into a Markdown report by a pure, unit-tested formatting function and written to a git-ignored `eval/reports/` directory.

**Tech Stack:** Python 3.14, FastAPI/pydantic v2 (existing), pytest (new dev dependency), `concurrent.futures.ThreadPoolExecutor` for bounded parallelism, no new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-04-play-gen-eval-harness-design.md`

## Global Constraints

- Reuse the existing validation logic (`_validate_geometry` + `_critique_play`) through one shared `validate_play()` function — do not build a new judge or scoring rubric.
- A test case passes iff `validate_play(...)` returns an empty list — the same binary bar `handle_generate_play` already uses to decide whether to retry.
- Concurrency: `ThreadPoolExecutor(max_workers=5)` — the Anthropic client is synchronous, so threads, not asyncio.
- Scope for this pass is `/generate-play` only — no `/query` retrieval scoring, no `/chat` scoring, no persistent cross-run history, no CI integration (all explicitly deferred in the spec).
- Reports are single-shot: one timestamped Markdown file per run in `eval/reports/`, which is git-ignored.
- Running the full suite makes real Anthropic API calls with a real dollar cost — `run_eval.py` must support a `--limit N` flag for cheap smoke testing, and the full 30-case run happens only by explicit choice.
- All new Python files use the same import style already in `rag-server/src/`: absolute imports rooted at `rag-server/` (e.g. `from src.config import ...`), never relative imports.

---

### Task 1: Extract `validate_play()` in `play_generator.py` + pytest setup

**Files:**
- Modify: `rag-server/requirements.txt`
- Create: `rag-server/pytest.ini`
- Modify: `rag-server/src/play_generator.py:342-344`
- Create: `rag-server/tests/test_play_generator.py`

**Interfaces:**
- Produces: `validate_play(description: str, data: dict, play_state: PlayEditorState) -> list[str]` in `src/play_generator.py` — combines `_validate_geometry(play_state)` and `_critique_play(description, data)`. Task 4 imports this.

- [ ] **Step 1: Add pytest to requirements and create pytest.ini**

Append to `rag-server/requirements.txt`:
```
pytest>=8.0.0
```

Create `rag-server/pytest.ini`:
```ini
[pytest]
pythonpath = .
```

This makes `rag-server/` importable as the root for `from src...` / `from eval...` imports regardless of where pytest is invoked from, matching how `src/main.py` already assumes `rag-server/` as the working directory.

- [ ] **Step 2: Install pytest into the existing venv**

Run: `cd rag-server && .venv/Scripts/python.exe -m pip install -r requirements.txt`
Expected: pytest installs successfully alongside the existing dependencies.

- [ ] **Step 3: Write the failing test**

Create `rag-server/tests/test_play_generator.py`:

```python
from unittest.mock import patch

from src.models import PlayEditorState, PlayerToken, Point
from src.play_generator import validate_play


def _play_with_four_tokens() -> PlayEditorState:
    """Only 4 offense tokens, well-spaced (canonical five-out minus one) —
    _validate_geometry should flag the missing 5th token and nothing else."""
    positions = [(370, 255), (330, 113), (330, 398), (87, 73)]
    tokens = [
        PlayerToken(id=f"offense-{i + 1}", type="offense", label=str(i + 1), position=Point(x=x, y=y))
        for i, (x, y) in enumerate(positions)
    ]
    return PlayEditorState(
        tokens=tokens,
        phases=[],
        ballCarrierId="offense-1",
        currentPhaseIndex=0,
        currentPhasePaths=[],
        courtMode="half",
    )


def _clean_five_out_play() -> PlayEditorState:
    positions = [(370, 255), (330, 113), (330, 398), (87, 73), (87, 438)]
    tokens = [
        PlayerToken(id=f"offense-{i + 1}", type="offense", label=str(i + 1), position=Point(x=x, y=y))
        for i, (x, y) in enumerate(positions)
    ]
    return PlayEditorState(
        tokens=tokens,
        phases=[],
        ballCarrierId="offense-1",
        currentPhaseIndex=0,
        currentPhasePaths=[],
        courtMode="half",
    )


@patch("src.play_generator._critique_play")
def test_validate_play_combines_geometry_and_critique_issues(mock_critique):
    mock_critique.return_value = ["CONCEPT MATCH: not a real concern here"]
    play_state = _play_with_four_tokens()
    data = {"name": "Test", "description": "test play", "play": play_state.model_dump()}

    issues = validate_play("test play", data, play_state)

    assert "Expected 5 offense tokens, got 4" in issues
    assert "CONCEPT MATCH: not a real concern here" in issues
    mock_critique.assert_called_once_with("test play", data)


@patch("src.play_generator._critique_play")
def test_validate_play_returns_empty_when_both_checks_pass(mock_critique):
    mock_critique.return_value = []
    play_state = _clean_five_out_play()
    data = {"name": "Test", "description": "clean play", "play": play_state.model_dump()}

    issues = validate_play("clean play", data, play_state)

    assert issues == []
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd rag-server && .venv/Scripts/python.exe -m pytest tests/test_play_generator.py -v`
Expected: FAIL — `ImportError: cannot import name 'validate_play' from 'src.play_generator'`

- [ ] **Step 5: Implement `validate_play` and wire it into `handle_generate_play`**

In `rag-server/src/play_generator.py`, insert this new function directly after `_critique_play` ends (after its closing `return result.get("issues", [])` / except block, before `def _generate_raw(...)`):

```python
def validate_play(description: str, data: dict, play_state: PlayEditorState) -> list[str]:
    """Combined geometry + LLM critique validation — the single bar for 'valid'.
    Shared by the production retry loop and the eval harness.
    """
    return _validate_geometry(play_state) + _critique_play(description, data)
```

Then in `handle_generate_play`, replace lines 342-344:
```python
        geo_issues = _validate_geometry(play_state)
        semantic_issues = _critique_play(request.description, data)
        all_issues = geo_issues + semantic_issues
```
with:
```python
        all_issues = validate_play(request.description, data, play_state)
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd rag-server && .venv/Scripts/python.exe -m pytest tests/test_play_generator.py -v`
Expected: PASS (2 passed)

- [ ] **Step 7: Commit**

```bash
git add rag-server/requirements.txt rag-server/pytest.ini rag-server/src/play_generator.py rag-server/tests/test_play_generator.py
git commit -m "refactor(rag-server): extract validate_play() for reuse by the eval harness"
```

---

### Task 2: `eval/test_cases.py` — the 30 categorized play requests

**Files:**
- Create: `rag-server/eval/__init__.py`
- Create: `rag-server/eval/test_cases.py`
- Create: `rag-server/tests/test_test_cases.py`

**Interfaces:**
- Produces: `TestCase` dataclass (`id: str, category: str, description: str, court_mode: Literal["half","full"] = "half"`) and `TEST_CASES: list[TestCase]` in `eval/test_cases.py` — Task 4 imports both.

- [ ] **Step 1: Write the failing test**

Create `rag-server/tests/test_test_cases.py`:

```python
from eval.test_cases import TEST_CASES


def test_has_thirty_cases():
    assert len(TEST_CASES) == 30


def test_all_ids_are_unique():
    ids = [case.id for case in TEST_CASES]
    assert len(ids) == len(set(ids))


def test_all_descriptions_are_nonempty():
    assert all(case.description.strip() for case in TEST_CASES)
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd rag-server && .venv/Scripts/python.exe -m pytest tests/test_test_cases.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'eval'`

- [ ] **Step 3: Create the eval package and test case data**

Create `rag-server/eval/__init__.py` (empty file).

Create `rag-server/eval/test_cases.py`:

```python
"""
~30 play-generation requests spanning the play families the knowledge base
covers. Used by eval/run_eval.py to score /generate-play output quality.
"""

from dataclasses import dataclass
from typing import Literal


@dataclass
class TestCase:
    id: str
    category: str
    description: str
    court_mode: Literal["half", "full"] = "half"


TEST_CASES: list[TestCase] = [
    # BLOB (4)
    TestCase("blob-01", "BLOB", "Baseline out-of-bounds play for a quick layup — stack formation near the rim, screen the primary defender away, inbounder hits the cutter for an easy bucket."),
    TestCase("blob-02", "BLOB", "BLOB set to get our best shooter a corner three off a staggered double screen."),
    TestCase("blob-03", "BLOB", "Baseline inbound against man-to-man where the point guard is trapped — need a safe outlet plus a backdoor option if they overplay the first pass."),
    TestCase("blob-04", "BLOB", "BLOB isolation play that clears one side of the floor for our post player to work one-on-one on the block."),

    # SLOB (3)
    TestCase("slob-01", "SLOB", "Sideline out-of-bounds play from the wing to get a quick catch-and-shoot three at the top of the key."),
    TestCase("slob-02", "SLOB", "Sideline inbound with a screen-the-screener action to spring our second option open on the wing."),
    TestCase("slob-03", "SLOB", "SLOB near half-court after a made basket — get the ball up the floor fast for a transition look before the defense sets."),

    # ATO (3)
    TestCase("ato-01", "ATO", "After-timeout play drawn up for one clean look — a stagger screen for our shooting guard coming off two screens to the top of the key for three."),
    TestCase("ato-02", "ATO", "ATO special: horns alignment into a quick ball screen for the point guard with a shooter spotting up in the corner."),
    TestCase("ato-03", "ATO", "After a timeout with 8 seconds left, need a play to get a good look for our best free-throw shooter to either score or draw a foul."),

    # Horns (2)
    TestCase("horns-01", "Horns", "Horns set — point guard at the top, two bigs at the elbows, wings in the corners — into a pick-and-roll with the near-side big."),
    TestCase("horns-02", "Horns", "Horns alignment that flows into a dribble handoff between the point guard and one of the elbow bigs, with the other big diving to the rim."),

    # Floppy (2)
    TestCase("floppy-01", "Floppy", "Floppy action off a made basket — shooter can curl off a down screen on one side or fade off a screen on the other, reading the defense."),
    TestCase("floppy-02", "Floppy", "Floppy set for our best three-point shooter, using a double screen on the block that they can curl or fade off of."),

    # Elevator (2)
    TestCase("elevator-01", "Elevator", "Elevator doors set to spring our shooter open at the top of the key for a clean catch-and-shoot three."),
    TestCase("elevator-02", "Elevator", "Elevator screen action out of a BLOB to get a jump shot for the player who's struggling to get separation off the dribble."),

    # DHO (2)
    TestCase("dho-01", "DHO", "Dribble handoff between the point guard and the wing, using the momentum to attack downhill off the handoff."),
    TestCase("dho-02", "DHO", "Chain of two dribble handoffs across the top of the key to probe the defense before attacking the rim."),

    # Motion-5 (2)
    TestCase("motion5-01", "Motion-5", "Five-out motion offense with constant cutting and screening — read-and-react basketball for a team with good spacing but no dominant scorer."),
    TestCase("motion5-02", "Motion-5", "Motion offense out of a five-out set that emphasizes back cuts whenever the defense overplays the passing lanes."),

    # Pick-and-roll (2)
    TestCase("pnr-01", "Pick-and-roll", "Side ball screen for the point guard with the screener rolling hard to the rim — simple two-man game to start the possession."),
    TestCase("pnr-02", "Pick-and-roll", "Top-of-the-key pick-and-roll where the screener pops out to the three-point line instead of rolling, since he's a good shooter."),

    # Zone offense (2)
    TestCase("zone-01", "Zone offense", "Offense against a 2-3 zone defense — attack the gaps and get the ball into the short corner for an easy look."),
    TestCase("zone-02", "Zone offense", "Offense to beat a 1-3-1 zone — overload one side of the floor and skip the ball to the weak side for an open three."),

    # Roster variation (2)
    TestCase("roster-01", "Roster variation", "Play built around our dominant post player — everyone else spaces the floor and the offense runs through the block."),
    TestCase("roster-02", "Roster variation", "Perimeter-heavy set for a team with no real post presence — everyone spread out beyond the arc, attacking off the dribble."),

    # Level segmentation (2)
    TestCase("youth-01", "Level segmentation", "Simple, easy-to-teach play for a youth team (U12) — basic spacing and one pass to get an open shot, nothing too complicated."),
    TestCase("comp-01", "Level segmentation", "Advanced set for a competitive high-level team — multiple reads, counters built in if the first option is taken away."),

    # Edge cases (2)
    TestCase("edge-01", "Edge case", "Quick hitter."),
    TestCase("edge-02", "Edge case", "Full-court press-break play to get the ball from baseline to baseline safely against a trapping defense.", court_mode="full"),
]
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd rag-server && .venv/Scripts/python.exe -m pytest tests/test_test_cases.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add rag-server/eval/__init__.py rag-server/eval/test_cases.py rag-server/tests/test_test_cases.py
git commit -m "feat(rag-server): add 30 categorized play-gen eval test cases"
```

---

### Task 3: `eval/report.py` — result model + report formatting

**Files:**
- Create: `rag-server/eval/report.py`
- Create: `rag-server/tests/test_report.py`

**Interfaces:**
- Produces: `EvalResult` dataclass (`id: str, category: str, description: str, issues: list[str]`, with a `passed` property) and `format_report(results: list[EvalResult], generation_model: str, critique_model: str, run_time: datetime) -> str` in `eval/report.py` — Task 4 imports both.

- [ ] **Step 1: Write the failing tests**

Create `rag-server/tests/test_report.py`:

```python
from datetime import datetime

from eval.report import EvalResult, format_report


def test_format_report_summary_and_category_table():
    results = [
        EvalResult(id="blob-01", category="BLOB", description="quick layup", issues=[]),
        EvalResult(id="blob-02", category="BLOB", description="corner three", issues=["bad spacing"]),
        EvalResult(id="horns-01", category="Horns", description="ball screen", issues=[]),
    ]
    run_time = datetime(2026, 9, 4, 14, 32, 10)

    report = format_report(results, "claude-sonnet-4-6", "claude-haiku-4-5-20251001", run_time)

    assert "# Play-Gen Eval Report — 2026-09-04 14:32:10" in report
    assert "Model: claude-sonnet-4-6 (generation) / claude-haiku-4-5-20251001 (critique)" in report
    assert "Result: 2 / 3 passed (67%)" in report
    assert "| BLOB | 1 | 2 |" in report
    assert "| Horns | 1 | 1 |" in report


def test_format_report_lists_failure_detail():
    results = [
        EvalResult(id="blob-02", category="BLOB", description="corner three", issues=["bad spacing", "wrong inbounder"]),
    ]
    run_time = datetime(2026, 9, 4, 14, 32, 10)

    report = format_report(results, "claude-sonnet-4-6", "claude-haiku-4-5-20251001", run_time)

    assert '### blob-02 (BLOB) — "corner three"' in report
    assert "- bad spacing" in report
    assert "- wrong inbounder" in report


def test_format_report_all_passed_shows_none():
    results = [EvalResult(id="blob-01", category="BLOB", description="quick layup", issues=[])]
    run_time = datetime(2026, 9, 4, 14, 32, 10)

    report = format_report(results, "claude-sonnet-4-6", "claude-haiku-4-5-20251001", run_time)

    assert "None — all cases passed." in report


def test_eval_result_passed_reflects_issues():
    assert EvalResult(id="a", category="X", description="d", issues=[]).passed is True
    assert EvalResult(id="a", category="X", description="d", issues=["oops"]).passed is False
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd rag-server && .venv/Scripts/python.exe -m pytest tests/test_report.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'eval.report'`

- [ ] **Step 3: Implement report.py**

Create `rag-server/eval/report.py`:

```python
"""Pure result model + Markdown report formatting for the play-gen eval harness.
No file I/O and no wall-clock reads here — run_eval.py owns both, which keeps
this module trivially unit-testable.
"""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class EvalResult:
    id: str
    category: str
    description: str
    issues: list[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return len(self.issues) == 0


def format_report(
    results: list[EvalResult],
    generation_model: str,
    critique_model: str,
    run_time: datetime,
) -> str:
    total = len(results)
    passed = sum(1 for r in results if r.passed)
    pct = round(passed / total * 100) if total else 0

    lines = [
        f"# Play-Gen Eval Report — {run_time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Model: {generation_model} (generation) / {critique_model} (critique)",
        f"Result: {passed} / {total} passed ({pct}%)",
        "",
        "## By category",
        "| Category | Passed | Total |",
        "|---|---|---|",
    ]

    for category in sorted(set(r.category for r in results)):
        cat_results = [r for r in results if r.category == category]
        cat_passed = sum(1 for r in cat_results if r.passed)
        lines.append(f"| {category} | {cat_passed} | {len(cat_results)} |")

    lines.append("")
    lines.append("## Failures")
    failures = [r for r in results if not r.passed]
    if not failures:
        lines.append("None — all cases passed.")
    else:
        for r in failures:
            lines.append(f'### {r.id} ({r.category}) — "{r.description}"')
            for issue in r.issues:
                lines.append(f"- {issue}")

    return "\n".join(lines)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd rag-server && .venv/Scripts/python.exe -m pytest tests/test_report.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add rag-server/eval/report.py rag-server/tests/test_report.py
git commit -m "feat(rag-server): add EvalResult model and Markdown report formatting"
```

---

### Task 4: `eval/run_eval.py` — orchestration, CLI, and smoke test

**Files:**
- Create: `rag-server/eval/run_eval.py`
- Modify: `rag-server/.gitignore`

**Interfaces:**
- Consumes: `validate_play` (Task 1, `src/play_generator.py`), `TestCase`/`TEST_CASES` (Task 2, `eval/test_cases.py`), `EvalResult`/`format_report` (Task 3, `eval/report.py`), plus existing `handle_generate_play` (`src/play_generator.py`), `PlayRequest` (`src/models.py`), `GENERATION_MODEL`/`QUERY_MODEL` (`src/config.py`).
- Produces: `rag-server/eval/run_eval.py`, runnable as `python -m eval.run_eval [--limit N]`; writes `eval/reports/<timestamp>.md` at runtime.

This task has no unit test — it's the orchestration layer that makes real Anthropic API calls, which the spec explicitly scopes to smoke-testing rather than automated unit tests (Tasks 1-3 already cover every piece of *logic* this task merely wires together).

- [ ] **Step 1: Add the reports directory to .gitignore**

In `rag-server/.gitignore`, add a new line:
```
eval/reports/
```

- [ ] **Step 2: Implement run_eval.py**

Create `rag-server/eval/run_eval.py`:

```python
"""
Play-generation eval harness.

Usage:
    python -m eval.run_eval               # run all 30 cases
    python -m eval.run_eval --limit 3      # smoke test with the first 3 cases

Makes real Anthropic API calls (Sonnet generation + Haiku critique) — each
run has a real dollar cost. Use --limit for a cheap smoke test before
running the full suite.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

from src.config import GENERATION_MODEL, QUERY_MODEL
from src.models import PlayRequest
from src.play_generator import handle_generate_play, validate_play
from eval.test_cases import TEST_CASES, TestCase
from eval.report import EvalResult, format_report

MAX_WORKERS = 5
REPORTS_DIR = Path(__file__).parent / "reports"


def _run_one(case: TestCase) -> EvalResult:
    try:
        response = handle_generate_play(
            PlayRequest(description=case.description, court_mode=case.court_mode)
        )
        issues = validate_play(case.description, response.model_dump(), response.play)
    except Exception as exc:
        issues = [f"{type(exc).__name__}: {exc}"]
    return EvalResult(id=case.id, category=case.category, description=case.description, issues=issues)


def run(cases: list[TestCase]) -> list[EvalResult]:
    results_by_id: dict[str, EvalResult] = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_id = {executor.submit(_run_one, case): case.id for case in cases}
        for future in as_completed(future_to_id):
            result = future.result()
            results_by_id[result.id] = result
    # Report in the original test-case order regardless of completion order.
    return [results_by_id[case.id] for case in cases]


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the play-generation eval suite.")
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Only run the first N test cases (for cheap smoke testing).",
    )
    args = parser.parse_args()

    cases = TEST_CASES[: args.limit] if args.limit else TEST_CASES
    print(f"Running {len(cases)} play-generation test case(s) with {MAX_WORKERS} concurrent workers...")

    results = run(cases)

    report = format_report(results, GENERATION_MODEL, QUERY_MODEL, datetime.now())
    print(report)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORTS_DIR / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    report_path.write_text(report, encoding="utf-8")
    print(f"\nReport written to {report_path}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Smoke test with 2 cases**

Run: `cd rag-server && .venv/Scripts/python.exe -m eval.run_eval --limit 2`

Expected: no traceback; console output ends with a report showing `Result: X / 2 passed (...)`, a category table with the 2 cases' categories, and a `Report written to .../eval/reports/<timestamp>.md` line. Requires `ANTHROPIC_API_KEY` to already be set in `rag-server/.env` (same variable the running server uses).

If it fails on import errors, verify Tasks 1-3 were committed and `pytest.ini`'s `pythonpath = .` is in place. If it fails on the Anthropic call, verify `rag-server/.env` has a valid `ANTHROPIC_API_KEY`.

- [ ] **Step 4: Commit**

```bash
git add rag-server/eval/run_eval.py rag-server/.gitignore
git commit -m "feat(rag-server): add play-gen eval harness runner (eval/run_eval.py)"
```

- [ ] **Step 5: (Optional, explicit opt-in) Run the full 30-case suite**

Run: `cd rag-server && .venv/Scripts/python.exe -m eval.run_eval`

This makes ~30-60 real Sonnet + Haiku calls and has a real dollar cost — only run it when you actually want a full quality baseline (e.g., right now, to get the first-ever baseline report; or later, to compare before/after a change). Not required to consider this plan complete; Step 3's smoke test is the completion bar for the harness itself.

---

## Self-Review Notes

- **Spec coverage:** Context/goals (all tasks), extracted `validate_play` (Task 1), 30 categorized test cases (Task 2), report format incl. category table + failures-only detail + "None — all cases passed" branch (Task 3), thread pool + `--limit` smoke testing + gitignored reports (Task 4), cost callout (Task 4 Step 3/5). No spec section is without a task.
- **Placeholder scan:** No TBD/TODO; every step has runnable code or an exact command.
- **Type consistency:** `validate_play(description: str, data: dict, play_state: PlayEditorState) -> list[str]` (Task 1) matches its call in Task 4 exactly. `EvalResult(id, category, description, issues)` (Task 3) matches every construction site in Task 4's `_run_one` and Task 3's own tests. `TestCase(id, category, description, court_mode)` (Task 2) matches its use in Task 4's `_run_one` (`case.description`, `case.court_mode`) and `PlayRequest` construction.
