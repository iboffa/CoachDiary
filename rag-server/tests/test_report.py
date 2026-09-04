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
