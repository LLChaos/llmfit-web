"""Tests for composite scoring function."""

import pytest
from src.services.scoring import calculate_total_score


class TestCalculateTotalScore:
    def test_perfect_all_scores_yields_100(self) -> None:
        """All sub-scores at 100 -> total should be 100."""
        scores = {
            "quality": 100.0,
            "speed": 100.0,
            "compatibility": 100.0,
            "context": 100.0,
        }
        result = calculate_total_score(scores)
        assert result == 100.0

    def test_zero_all_scores_yields_0(self) -> None:
        """All sub-scores at 0 -> total should be 0."""
        scores = {
            "quality": 0.0,
            "speed": 0.0,
            "compatibility": 0.0,
            "context": 0.0,
        }
        result = calculate_total_score(scores)
        assert result == 0.0

    def test_weighted_average_correct(self) -> None:
        """Verify: 0.40*Q + 0.25*S + 0.20*C + 0.15*X."""
        scores = {
            "quality": 80.0,
            "speed": 60.0,
            "compatibility": 70.0,
            "context": 50.0,
        }
        result = calculate_total_score(scores)
        expected = 0.40 * 80 + 0.25 * 60 + 0.20 * 70 + 0.15 * 50
        assert result == pytest.approx(expected)

    def test_weights_sum_to_one(self) -> None:
        """Weights should sum to 1.0."""
        import src.services.scoring as scoring

        total_weight = (
            scoring.WEIGHT_QUALITY
            + scoring.WEIGHT_SPEED
            + scoring.WEIGHT_COMPATIBILITY
            + scoring.WEIGHT_CONTEXT
        )
        assert total_weight == pytest.approx(1.0)

    def test_result_never_exceeds_100(self) -> None:
        """Total score clamped to max 100."""
        scores = {
            "quality": 150.0,
            "speed": 200.0,
            "compatibility": 300.0,
            "context": 999.0,
        }
        result = calculate_total_score(scores)
        assert result <= 100.0

    def test_result_never_below_0(self) -> None:
        """Total score never negative."""
        scores = {
            "quality": -10.0,
            "speed": -5.0,
            "compatibility": -3.0,
            "context": -1.0,
        }
        result = calculate_total_score(scores)
        assert result >= 0.0
