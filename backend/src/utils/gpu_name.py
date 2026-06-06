"""GPU name matching utilities.

Shared helpers used by GPU repository implementations to resolve
browser-reported GPU names against the database.
"""

import re


def token_overlap_score(query: str, candidate: str) -> float:
    """Score a candidate GPU name against a query string by token overlap.

    Extracts *significant* tokens (model numbers like "4080", series
    identifiers like "RTX", "RX", "Arc") from both strings and returns
    the Jaccard-like overlap ratio.

    Returns a float in [0.0, 1.0].  Higher is better.
    """
    query_tokens = _extract_significant_tokens(query)
    candidate_tokens = _extract_significant_tokens(candidate)

    if not query_tokens or not candidate_tokens:
        return 0.0

    intersection = query_tokens & candidate_tokens
    union = query_tokens | candidate_tokens

    return len(intersection) / len(union) if union else 0.0


def _extract_significant_tokens(name: str) -> set[str]:
    """Extract model numbers and GPU family tokens from a GPU name.

    Example:
        "NVIDIA GeForce RTX 4080 Mobile" → {"rtx", "4080"}
        "AMD Radeon RX 7900 XTX"         → {"rx", "7900", "xtx"}
    """
    normalized = name.lower().strip()

    tokens: set[str] = set()

    # Numeric model identifiers (e.g. "4080", "7900")
    for m in re.finditer(r"\b(\d{3,5})\b", normalized):
        tokens.add(m.group(1))

    # GPU family / series names
    _SERIES_PATTERNS = (
        r"\b(rtx)\b",
        r"\b(gtx)\b",
        r"\b(rx)\b",
        r"\b(arc)\b",
        r"\b(radeon)\b",
        r"\b(geforce)\b",
        r"\b(uhd)\b",
        r"\b(iris)\b",
        r"\b(quadro)\b",
        r"\b(firepro)\b",
        r"\b(tesla)\b",
    )
    for pattern in _SERIES_PATTERNS:
        for m in re.finditer(pattern, normalized):
            tokens.add(m.group(1))

    return tokens
