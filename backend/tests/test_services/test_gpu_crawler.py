"""Tests for GPU crawler — pure transformation functions (no dbgpu needed)."""

import pytest
from unittest.mock import MagicMock
from src.services.gpu_crawler import (
    assign_tier,
    generate_gpu_slug,
    map_dbgpu_to_record,
    _is_consumer_gpu,
)


class TestAssignTier:
    def test_enthusiast_by_vram(self) -> None:
        assert assign_tier(vram_gb=32.0, flops_tflops=10.0) == "enthusiast"

    def test_enthusiast_by_flops(self) -> None:
        assert assign_tier(vram_gb=8.0, flops_tflops=40.0) == "enthusiast"

    def test_high_by_vram(self) -> None:
        assert assign_tier(vram_gb=16.0, flops_tflops=10.0) == "high"

    def test_high_by_flops(self) -> None:
        assert assign_tier(vram_gb=8.0, flops_tflops=30.0) == "high"

    def test_mid_by_vram(self) -> None:
        assert assign_tier(vram_gb=8.0, flops_tflops=5.0) == "mid"

    def test_mid_by_flops(self) -> None:
        assert assign_tier(vram_gb=4.0, flops_tflops=10.0) == "mid"

    def test_entry(self) -> None:
        assert assign_tier(vram_gb=4.0, flops_tflops=2.0) == "entry"

    def test_none_flops(self) -> None:
        assert assign_tier(vram_gb=12.0, flops_tflops=None) == "mid"

    def test_entry_none_flops(self) -> None:
        assert assign_tier(vram_gb=4.0, flops_tflops=None) == "entry"

    def test_mid_boundary_8gb(self) -> None:
        assert assign_tier(vram_gb=8.0, flops_tflops=7.9) == "mid"

    def test_high_boundary_16gb(self) -> None:
        assert assign_tier(vram_gb=16.0, flops_tflops=24.0) == "high"

    def test_enthusiast_boundary_32gb(self) -> None:
        assert assign_tier(vram_gb=32.0, flops_tflops=39.0) == "enthusiast"


class TestGenerateGpuSlug:
    def test_nvidia(self) -> None:
        slug = generate_gpu_slug("nvidia", "GeForce RTX 4090", 24.0)
        assert slug == "gpu-nvidia-geforce-rtx-4090-24gb"

    def test_amd(self) -> None:
        slug = generate_gpu_slug("amd", "Radeon RX 7900 XTX", 24.0)
        assert slug == "gpu-amd-radeon-rx-7900-xtx-24gb"

    def test_apple(self) -> None:
        slug = generate_gpu_slug("apple", "Apple M4 Max", 48.0)
        assert slug == "gpu-apple-apple-m4-max-48gb"

    def test_spaces_replaced(self) -> None:
        slug = generate_gpu_slug("nvidia", "GeForce RTX 3060 Ti", 8.0)
        assert slug == "gpu-nvidia-geforce-rtx-3060-ti-8gb"


class TestMapDbgpuToRecord:
    def test_basic_mapping(self) -> None:
        spec = MagicMock()
        spec.manufacturer = "NVIDIA"
        spec.name = "GeForce RTX 4090"
        spec.memory_size_gb = 24.0
        spec.memory_bandwidth_gb_s = 1008.0
        spec.single_float_performance_gflop_s = 82580.0

        record = map_dbgpu_to_record(spec)
        assert record["vendor"] == "nvidia"
        assert record["name"] == "GeForce RTX 4090"
        assert record["vram_gb"] == 24.0
        assert record["flops_tflops"] == 82.58
        assert record["memory_bandwidth_gb_s"] == 1008.0
        assert record["tier"] == "enthusiast"  # 82.58 TFLOPS >= 40
        assert record["benchmark_score"] is None
        assert "gpu-nvidia-geforce-rtx-4090-24gb" in record["slug"]

    def test_unknown_vendor_normalized(self) -> None:
        spec = MagicMock()
        spec.manufacturer = "SomeNewVendor"
        spec.name = "Test GPU"
        spec.memory_size_gb = 8.0
        spec.memory_bandwidth_gb_s = None
        spec.single_float_performance_gflop_s = None

        record = map_dbgpu_to_record(spec)
        assert record["vendor"] == "somenewvendor"
        assert record["flops_tflops"] is None
        assert record["memory_bandwidth_gb_s"] is None

    def test_missing_flops(self) -> None:
        spec = MagicMock()
        spec.manufacturer = "AMD"
        spec.name = "Radeon RX 6600"
        spec.memory_size_gb = 8.0
        spec.memory_bandwidth_gb_s = 224.0
        spec.single_float_performance_gflop_s = None

        record = map_dbgpu_to_record(spec)
        assert record["flops_tflops"] is None
        assert record["tier"] == "mid"  # based on VRAM only


class TestIsConsumerGpu:
    def _make_spec(self, name: str, manufacturer: str = "NVIDIA", vram: float = 8.0) -> MagicMock:
        spec = MagicMock()
        spec.name = name
        spec.manufacturer = manufacturer
        spec.memory_size_gb = vram
        return spec

    def test_geforce_is_consumer(self) -> None:
        assert _is_consumer_gpu(self._make_spec("GeForce RTX 3060")) is True

    def test_radeon_is_consumer(self) -> None:
        assert _is_consumer_gpu(self._make_spec("Radeon RX 6800", "AMD")) is True

    def test_apple_is_consumer(self) -> None:
        assert _is_consumer_gpu(self._make_spec("Apple M4 Max", "Apple", 48.0)) is True

    def test_quadro_is_not_consumer(self) -> None:
        assert _is_consumer_gpu(self._make_spec("Quadro RTX 4000")) is False

    def test_tesla_is_not_consumer(self) -> None:
        assert _is_consumer_gpu(self._make_spec("Tesla V100")) is False

    def test_over_48gb_is_not_consumer(self) -> None:
        assert _is_consumer_gpu(self._make_spec("GeForce RTX 9090", "NVIDIA", 64.0)) is False

    def test_instinct_is_not_consumer(self) -> None:
        assert _is_consumer_gpu(self._make_spec("AMD Instinct MI300X", "AMD", 192.0)) is False

    def test_radeon_pro_is_not_consumer(self) -> None:
        assert _is_consumer_gpu(self._make_spec("Radeon Pro W6800", "AMD", 32.0)) is False
