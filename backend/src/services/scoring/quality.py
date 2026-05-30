"""Quality scorer — evaluates model quality from pre-stored benchmark scores.

Weight: 40% of total recommendation score.
"""


def score_quality(model: dict[str, object]) -> float:
    """Return the pre-stored quality score for a model.

    The quality_score is a pre-assigned 0-100 rating based on
    benchmark evaluations (MMLU, HumanEval, etc.).

    Args:
        model: Model spec dict with 'quality_score' key.

    Returns:
        Quality score as float (0-100).
    """
    return float(model["quality_score"])
