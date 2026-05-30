"""Tests for quality scorer."""

from src.services.scoring.quality import score_quality


class TestScoreQuality:
    def test_returns_model_quality_score(self) -> None:
        """Quality score is the pre-stored model quality_score (0-100)."""
        model = {"quality_score": 78}
        result = score_quality(model)
        assert result == 78.0

    def test_returns_float(self) -> None:
        """Result should always be a float."""
        model = {"quality_score": 90}
        result = score_quality(model)
        assert isinstance(result, float)

    def test_perfect_score_is_100(self) -> None:
        """Max quality score is 100."""
        model = {"quality_score": 100}
        assert score_quality(model) == 100.0

    def test_zero_score(self) -> None:
        """Min quality score is 0."""
        model = {"quality_score": 0}
        assert score_quality(model) == 0.0
