from unittest.mock import MagicMock, patch

from src.models import PlayEditorState, PlayerToken, Point
from src.play_generator import validate_play, _critique_play


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


def _mock_response(text: str):
    response = MagicMock()
    response.content = [MagicMock(text=text)]
    return response


@patch("src.play_generator._client")
def test_critique_play_strips_markdown_fence_before_parsing(mock_client):
    mock_client.messages.create.return_value = _mock_response(
        '```json\n{"valid": false, "issues": ["CONCEPT MATCH: bad inbounder position"]}\n```'
    )

    issues = _critique_play("test play", {"name": "Test", "description": "d", "play": {}})

    assert issues == ["CONCEPT MATCH: bad inbounder position"]


@patch("src.play_generator._client")
def test_critique_play_returns_sentinel_issue_on_unparseable_response(mock_client):
    mock_client.messages.create.return_value = _mock_response("not valid json at all")

    issues = _critique_play("test play", {"name": "Test", "description": "d", "play": {}})

    assert issues == ["critique unavailable: could not parse Haiku's response"]


@patch("src.play_generator._client")
def test_critique_play_returns_sentinel_when_fenced_but_still_unparseable(mock_client):
    mock_client.messages.create.return_value = _mock_response(
        "```json\nnot json even after stripping the fence\n```"
    )

    issues = _critique_play("test play", {"name": "Test", "description": "d", "play": {}})

    assert issues == ["critique unavailable: could not parse Haiku's response"]


@patch("src.play_generator._client")
def test_critique_play_returns_empty_when_valid(mock_client):
    mock_client.messages.create.return_value = _mock_response('{"valid": true}')

    issues = _critique_play("test play", {"name": "Test", "description": "d", "play": {}})

    assert issues == []
