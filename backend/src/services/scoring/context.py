"""Context scorer — evaluates model context length relative to 128K benchmark.

Weight: 15% of total recommendation score.

Formula:
    base_score = min(100, (model_context / 131072) * 100)
    vram_ratio = min(1.0, vram_available / recommended_vram_gb)
    final_score = base_score * vram_ratio

The VRAM ratio reduces the score when the GPU may not have enough memory
to fully utilize the model's maximum context length.
"""


def score_context(model: dict[str, object], vram_available: float) -> float:
    """Calculate context score based on model context length and VRAM.

    Args:
        model: Model spec dict with 'context_length' and 'recommended_vram_gb'.
        vram_available: Available GPU VRAM in GB.

    Returns:
        Context score 0-100.
    """
    context_length = model["context_length"]  # type: ignore[typeddict-item]
    recommended_vram = model["recommended_vram_gb"]  # type: ignore[typeddict-item]

    base_score = min(100.0, (context_length / 131072.0) * 100.0)  # type: ignore[operator]

    if recommended_vram > 0:  # type: ignore[operator]
        vram_ratio = min(1.0, vram_available / recommended_vram)  # type: ignore[operator]
    else:
        vram_ratio = 1.0

    return max(0.0, base_score * vram_ratio)
