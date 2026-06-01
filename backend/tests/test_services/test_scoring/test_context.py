"""Tests for context scorer."""

import pytest
from src.services.scoring.context import score_context


class TestScoreContext:
    def test_128k_context_capped_at_100(self) -> None:
        """131072 context > 32768 benchmark → capped at 100."""
        model = {"context_length": 131072, "recommended_vram_gb": 10.0}
        result = score_context(model, vram_available=12.0)
        assert result == 100.0

    def test_32k_context_gives_100(self) -> None:
        """32768 context -> 100 (equals the 32K benchmark)."""
        model = {"context_length": 32768, "recommended_vram_gb": 6.0}
        result = score_context(model, vram_available=12.0)
        assert result == 100.0

    def test_8k_context_gives_25(self) -> None:
        """8192 context -> 25% of 32K benchmark = 25 points."""
        model = {"context_length": 8192, "recommended_vram_gb": 6.0}
        result = score_context(model, vram_available=12.0)
        expected = (8192 / 32768) * 100.0
        assert result == pytest.approx(expected)  # 25.0

    def test_vram_insufficient_reduces_score(self) -> None:
        """When VRAM < recommended, context score is reduced."""
        model = {"context_length": 32768, "recommended_vram_gb": 22.0}
        result_full = score_context(model, vram_available=44.0)
        result_limited = score_context(model, vram_available=11.0)
        assert result_limited < result_full

    def test_vram_exactly_recommended_no_reduction(self) -> None:
        """When VRAM == recommended_vram_gb, no reduction (ratio = 1.0)."""
        model = {"context_length": 16384, "recommended_vram_gb": 6.0}
        result = score_context(model, vram_available=6.0)
        expected = (16384 / 32768) * 100.0
        assert result == pytest.approx(expected)

    def test_score_never_below_zero(self) -> None:
        """Score should never be negative."""
        model = {"context_length": 1024, "recommended_vram_gb": 100.0}
        result = score_context(model, vram_available=1.0)
        assert result >= 0.0
