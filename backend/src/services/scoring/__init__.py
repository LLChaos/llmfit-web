"""Scoring module — composite scoring system for model recommendations.

Weights (must sum to 1.0):
    Quality:        40% — pre-stored model quality benchmark
    Speed:          25% — estimated TPS vs 20 TPS threshold
    Compatibility:  20% — VRAM headroom analysis
    Context:        15% — context length vs 128K benchmark
"""

# Weights
WEIGHT_QUALITY = 0.40
WEIGHT_SPEED = 0.25
WEIGHT_COMPATIBILITY = 0.20
WEIGHT_CONTEXT = 0.15

# Re-export scoring functions
from src.services.scoring.quality import score_quality  # noqa: E402, F401
from src.services.scoring.speed import score_speed  # noqa: E402, F401
from src.services.scoring.compatibility import score_compatibility  # noqa: E402, F401
from src.services.scoring.context import score_context  # noqa: E402, F401


def calculate_total_score(scores: dict[str, float]) -> float:
    """Calculate weighted composite score.

    Args:
        scores: dict with keys 'quality', 'speed', 'compatibility', 'context'.
                Each value should be 0-100.

    Returns:
        Weighted total score 0-100.

    Formula:
        Score_total = 0.40*Q + 0.25*S + 0.20*C + 0.15*X
    """
    total = (
        WEIGHT_QUALITY * scores["quality"]
        + WEIGHT_SPEED * scores["speed"]
        + WEIGHT_COMPATIBILITY * scores["compatibility"]
        + WEIGHT_CONTEXT * scores["context"]
    )
    return max(0.0, min(100.0, total))
