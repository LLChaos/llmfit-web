"""Tests for GPU Mapper service."""

import pytest
from src.services.gpu_mapper import GpuMapper, GpuMappingError
from src.repositories.json_gpu_repository import JsonGpuRepository


@pytest.fixture
def gpu_repo(data_dir):
    return JsonGpuRepository(data_dir / "mock_gpu_specs.json")


@pytest.fixture
def gpu_mapper(gpu_repo):
    return GpuMapper(gpu_repo)


class TestGpuMapper:
    def test_map_exact_gpu_name_returns_full_spec(self, gpu_mapper) -> None:
        """Exact GPU name should return complete spec dict."""
        result = gpu_mapper.map("NVIDIA GeForce RTX 3060")
        assert result is not None
        assert result["name"] == "NVIDIA GeForce RTX 3060"
        assert result["vram_gb"] == 12.0
        assert result["tier"] == "mid"
        assert result["vendor"] == "nvidia"
        assert result["flops_tflops"] is not None

    def test_map_fuzzy_name_finds_closest_match(self, gpu_mapper) -> None:
        """Partial/fuzzy name should still resolve via find_closest_match."""
        result = gpu_mapper.map("RTX 4090")
        assert result is not None
        assert "4090" in result["name"]

    def test_map_unknown_gpu_raises_error(self, gpu_mapper) -> None:
        """Completely unknown GPU name should raise GpuMappingError."""
        with pytest.raises(GpuMappingError):
            gpu_mapper.map("FakeGPU XYZ-9999")

    def test_map_empty_string_raises_error(self, gpu_mapper) -> None:
        """Empty GPU name should raise GpuMappingError."""
        with pytest.raises(GpuMappingError):
            gpu_mapper.map("")

    def test_map_whitespace_string_raises_error(self, gpu_mapper) -> None:
        """Whitespace-only string should raise GpuMappingError."""
        with pytest.raises(GpuMappingError):
            gpu_mapper.map("   ")

    def test_map_preserves_all_required_fields(self, gpu_mapper) -> None:
        """Mapped GPU must contain all fields needed by downstream scorers."""
        result = gpu_mapper.map("RTX 3060")
        required_fields = [
            "name", "vram_gb", "tier", "vendor",
            "benchmark_score", "flops_tflops", "memory_bandwidth_gb_s",
        ]
        for field in required_fields:
            assert field in result, f"Missing required field: {field}"
