from unittest.mock import MagicMock, patch

from src.play_generator import _critique_play


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
