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
