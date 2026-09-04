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
from src.vector_store import retrieve
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
        futures = [executor.submit(_run_one, case) for case in cases]
        for future in as_completed(futures):
            result = future.result()
            status = "PASS" if result.passed else "FAIL"
            print(f"  [{status}] {result.id}")
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
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be a positive integer")

    cases = TEST_CASES[: args.limit] if args.limit is not None else TEST_CASES
    print(f"Running {len(cases)} play-generation test case(s) with {MAX_WORKERS} concurrent workers...")

    print("Checking knowledge base is ingested...")
    if not retrieve("pick and roll", k=1):
        raise SystemExit("Knowledge base is empty — run `python ingest.py` first.")

    results = run(cases)

    run_time = datetime.now()
    report = format_report(results, GENERATION_MODEL, QUERY_MODEL, run_time)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORTS_DIR / f"{run_time.strftime('%Y%m%d_%H%M%S')}.md"
    report_path.write_text(report, encoding="utf-8")

    print(report)
    print(f"\nReport written to {report_path}")


if __name__ == "__main__":
    main()
