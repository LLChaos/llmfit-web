"""GPU Mapper — resolves browser-reported GPU name to full hardware spec.

When the exact GPU cannot be found, a conservative fallback configuration is
returned instead of raising an error. This keeps the recommendation pipeline
functional even for uncommon or integrated GPUs.
"""

import logging
import re

from src.repositories.interfaces import IGpuRepository

logger = logging.getLogger(__name__)

# ── GPU name normalization ────────────────────────────────────────
# WebGL UNMASKED_RENDERER_WEBGL uses different terminology than the
# dbgpu / TechPowerUp database.  Normalize before matching so that
# e.g. "NVIDIA GeForce RTX 4080 Laptop GPU" resolves to the dbgpu
# entry "GeForce RTX 4080 Mobile".

# Step 1: strip redundant vendor prefixes that WebGL adds but dbgpu
# omits.  These brands are unambiguous — "GeForce" always means
# NVIDIA, "Radeon" always means AMD, etc.
_VENDOR_PREFIXES: list[tuple[str, str]] = [
    (r"\bNVIDIA\s+(?=GeForce|RTX|GTX|Quadro|Tesla)", ""),
    (r"\bAMD\s+(?=Radeon|FirePro)", ""),
    (r"\bIntel\s+(?=Arc|UHD|Iris|HD\s)", ""),
]

# Step 2: normalize laptop/mobile synonym terms
_LAPTOP_SYNONYMS: list[tuple[str, str]] = [
    (r"\blaptop\s*gpu\b", "Mobile"),
    (r"\bnotebook\s*gpu\b", "Mobile"),
]


def normalize_gpu_name(name: str) -> str:
    """Normalize a browser-reported GPU name to dbgpu-compatible form.

    Rules applied in order (case-insensitive):
        1. Strip redundant vendor prefix
           ``NVIDIA GeForce`` → ``GeForce``, ``AMD Radeon`` → ``Radeon``
        2. Normalize mobile terminology
           ``Laptop GPU``  → ``Mobile``
           ``Notebook GPU`` → ``Mobile``

    Returns the normalized name.  If no rules match, the original
    name is returned unchanged.
    """
    normalized = name.strip()
    for pattern, replacement in _VENDOR_PREFIXES:
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
    for pattern, replacement in _LAPTOP_SYNONYMS:
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
    # Collapse any double spaces introduced by prefix removal
    normalized = re.sub(r" {2,}", " ", normalized)
    return normalized.strip()

# Conservative fallback for unrecognized GPUs.
# Assumes 4 GB VRAM (entry-level) and skips speed-sensitive scoring.
_FALLBACK_GPU: dict[str, object] = {
    "name": "Unknown GPU (fallback)",
    "vendor": "unknown",
    "vram_gb": 4.0,
    "benchmark_score": None,
    "flops_tflops": None,
    "memory_bandwidth_gb_s": None,
    "tier": "entry",
}


class GpuMappingError(Exception):
    """Raised when a GPU name cannot be resolved in the database."""

    def __init__(self, gpu_name: str) -> None:
        self.gpu_name = gpu_name
        cleaned = gpu_name.strip() or "<empty>"
        super().__init__(f"GPU '{cleaned}' not found in database")


class GpuMapper:
    """Resolves GPU names from browser detection to full specs.

    If no match is found, returns a conservative fallback config
    (entry tier, 4 GB VRAM) so the recommendation pipeline can
    still produce useful results for the user.
    """

    def __init__(self, gpu_repo: IGpuRepository) -> None:
        self._gpu_repo = gpu_repo

    def map(self, gpu_name: str) -> dict[str, object]:
        """Resolve a GPU name to its full specification.

        Returns:
            dict with all GPU spec fields. Falls back to a conservative
            entry-tier config when the GPU is not found in the database.

        Raises:
            GpuMappingError: Only when gpu_name is empty/whitespace.
        """
        if not gpu_name or not gpu_name.strip():
            raise GpuMappingError(gpu_name or "")

        normalized = normalize_gpu_name(gpu_name)

        gpu = self._gpu_repo.find_closest_match(normalized)
        if gpu is not None:
            return gpu

        logger.warning(
            "GPU '%s' (normalized: '%s') not found in database — using fallback (entry/4GB).",
            gpu_name,
            normalized,
        )
        return dict(_FALLBACK_GPU, name=gpu_name)
