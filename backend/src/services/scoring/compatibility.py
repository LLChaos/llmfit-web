"""Compatibility scorer — evaluates VRAM headroom between GPU and model.

Weight: 20% of total recommendation score.

Formula:
    headroom = (vram_available - vram_required) / vram_required
    score = clamp(headroom / 1.0 * 100, 0, 100)

- headroom >= 100% (2x required VRAM) -> score 100 (very comfortable)
- headroom = 50% -> score 50 (adequate, some headroom)
- headroom <= 0% -> score 0 (barely fits, no safety margin)
"""


def score_compatibility(vram_available: float, vram_required: float) -> float:
    """Calculate compatibility score based on VRAM headroom.

    Args:
        vram_available: Available GPU VRAM in GB.
        vram_required: Model recommended VRAM in GB.

    Returns:
        Compatibility score 0-100.
    """
    if vram_required <= 0:
        return 0.0

    headroom = (vram_available - vram_required) / vram_required
    score = (headroom / 1.0) * 100.0
    return max(0.0, min(100.0, score))
