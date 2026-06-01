"""GPU Mapper — resolves browser-reported GPU name to full hardware spec.

When the exact GPU cannot be found, a conservative fallback configuration is
returned instead of raising an error. This keeps the recommendation pipeline
functional even for uncommon or integrated GPUs.
"""

import logging

from src.repositories.interfaces import IGpuRepository

logger = logging.getLogger(__name__)

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

        gpu = self._gpu_repo.find_closest_match(gpu_name)
        if gpu is not None:
            return gpu

        logger.warning(
            "GPU '%s' not found in database — using fallback (entry/4GB).",
            gpu_name,
        )
        return dict(_FALLBACK_GPU, name=gpu_name)
