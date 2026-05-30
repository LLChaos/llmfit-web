"""Tests for context scorer."""

import pytest
from src.services.scoring.context import score_context


class TestScoreContext:
    def test_128k_context_gives_100(self) -> None:
        """131072 context length -> score 100 (max benchmark)."""
        model = {"context_length": 131072, "recommended_vram_gb": 10.0}
        result = score_context(model, vram_available=12.0)
        assert result == 100.0

    def test_32k_context_gives_proportional_score(self) -> None:
        """32768 context -> ~25% of 131072."""
        model = {"context_length": 32768, "recommended_vram_gb": 6.0}
        result = score_context(model, vram_available=12.0)
        expected = min(100.0, (32768 / 131072) * 100.0)
        assert result == pytest.approx(expected)

    def test_vram_insufficient_reduces_score(self) -> None:
        """When VRAM < recommended, context score is reduced."""
        model = {"context_length": 131072, "recommended_vram_gb": 22.0}
        result_full = score_context(model, vram_available=44.0)
        result_limited = score_context(model, vram_available=11.0)
        assert result_limited < result_full

    def test_vram_exactly_recommended_no_reduction(self) -> None:
        """When VRAM == recommended_vram_gb, no reduction."""
        model = {"context_length": 65536, "recommended_vram_gb": 6.0}
        result = score_context(model, vram_available=6.0)
        expected = (65536 / 131072) * 100.0
        assert result == pytest.approx(expected)

    def test_score_never_below_zero(self) -> None:
        """Score should never be negative."""
        model = {"context_length": 1024, "recommended_vram_gb": 100.0}
        result = score_context(model, vram_available=1.0)
        assert result >= 0.0
