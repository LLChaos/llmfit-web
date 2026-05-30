"""GPU Mapper — resolves browser-reported GPU name to full hardware spec."""

from src.repositories.interfaces import IGpuRepository


class GpuMappingError(Exception):
    """Raised when a GPU name cannot be resolved in the database."""

    def __init__(self, gpu_name: str) -> None:
        self.gpu_name = gpu_name
        cleaned = gpu_name.strip() or "<empty>"
        super().__init__(f"GPU '{cleaned}' not found in database")


class GpuMapper:
    """Resolves GPU names from browser detection to full specs.

    Uses IGpuRepository.find_closest_match for fuzzy matching,
    supporting partial names from WebGPU/WebGL APIs.
    """

    def __init__(self, gpu_repo: IGpuRepository) -> None:
        self._gpu_repo = gpu_repo

    def map(self, gpu_name: str) -> dict[str, object]:
        """Resolve a GPU name to its full specification.

        Args:
            gpu_name: Raw GPU name from browser (may be partial/inexact).

        Returns:
            dict with all GPU spec fields (name, vram_gb, tier, vendor,
            benchmark_score, flops_tflops, memory_bandwidth_gb_s).

        Raises:
            GpuMappingError: If GPU cannot be found in database.
        """
        if not gpu_name or not gpu_name.strip():
            raise GpuMappingError(gpu_name or "")

        gpu = self._gpu_repo.find_closest_match(gpu_name)
        if gpu is None:
            raise GpuMappingError(gpu_name)

        return gpu
