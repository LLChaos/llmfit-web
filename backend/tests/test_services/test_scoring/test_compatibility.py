"""Tests for compatibility scorer."""

import pytest
from src.services.scoring.compatibility import score_compatibility


class TestScoreCompatibility:
    def test_headroom_100_pct_gives_100(self) -> None:
        """100% VRAM headroom (2x required) -> score 100."""
        result = score_compatibility(vram_available=16.0, vram_required=8.0)
        assert result == 100.0

    def test_headroom_50_pct_gives_50(self) -> None:
        """50% VRAM headroom -> score 50."""
        result = score_compatibility(vram_available=12.0, vram_required=8.0)
        assert result == 50.0

    def test_zero_headroom_gives_0(self) -> None:
        """No headroom (exact match) -> 0."""
        result = score_compatibility(vram_available=6.0, vram_required=6.0)
        assert result == 0.0

    def test_negative_headroom_returns_0(self) -> None:
        """Insufficient VRAM -> 0 (filtered out)."""
        result = score_compatibility(vram_available=4.0, vram_required=8.0)
        assert result == 0.0

    def test_large_headroom_capped_at_100(self) -> None:
        """Very large headroom capped at 100."""
        result = score_compatibility(vram_available=24.0, vram_required=2.0)
        assert result == 100.0

    def test_partial_headroom_gives_proportional_score(self) -> None:
        """25% headroom -> 25 points."""
        result = score_compatibility(vram_available=10.0, vram_required=8.0)
        assert result == 25.0

    def test_zero_vram_required_returns_0(self) -> None:
        """Edge case: zero required VRAM -> 0 (no division by zero)."""
        result = score_compatibility(vram_available=8.0, vram_required=0.0)
        assert result == 0.0
