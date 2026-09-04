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
