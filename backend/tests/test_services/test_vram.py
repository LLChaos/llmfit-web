"""Tests for VRAM estimation utility functions."""

from src.utils.vram import (
    bytes_to_gb,
    estimate_tpot,
    estimate_tps,
    estimate_vram_precise,
    estimate_vram_simple,
)


class TestEstimateVramSimple:
    def test_default_quantization_16bit(self) -> None:
        """7B model at 16-bit: 7 * 2 * 1.2 = 16.8 GB."""
        result = estimate_vram_simple(7.0, quantization_bits=16)
        assert result == 7.0 * (16 / 8.0) * 1.2

    def test_4bit_quantization(self) -> None:
        """7B model at 4-bit: 7 * 0.5 * 1.2 = 4.2 GB."""
        result = estimate_vram_simple(7.0, quantization_bits=4)
        assert result == 7.0 * (4 / 8.0) * 1.2

    def test_custom_overhead(self) -> None:
        """Custom overhead factor should affect result."""
        result = estimate_vram_simple(7.0, quantization_bits=4, overhead=0.0)
        assert result == 7.0 * 0.5 * 1.0


class TestEstimateVramPrecise:
    def test_returns_bytes(self) -> None:
        """Result should be in bytes (very large number)."""
        result = estimate_vram_precise(
            num_params=7_000_000_000,
            hidden_dim=4096,
            num_layers=32,
        )
        # 7B params * 2 bytes + 2*4096*32*1*4096*2 = ~14GB in bytes
        assert result > 1e9  # Should be billions of bytes


class TestBytesToGb:
    def test_conversion(self) -> None:
        """1 GB = 1024^3 bytes."""
        assert bytes_to_gb(1024**3) == 1.0

    def test_zero_bytes(self) -> None:
        assert bytes_to_gb(0.0) == 0.0


class TestEstimateTps:
    def test_returns_positive_value(self) -> None:
        """TPS should be positive for valid inputs."""
        tps = estimate_tps(
            num_params=7_000_000_000,
            batch_size=1,
            gpu_flops=12.74e12,
            gpu_bandwidth_gb_s=360.0,
        )
        assert tps > 0

    def test_tiny_gpu_yields_near_zero_tps(self) -> None:
        """With near-zero GPU specs, TPS approaches 0."""
        tps = estimate_tps(
            num_params=7_000_000_000,
            batch_size=1,
            gpu_flops=0.001,
            gpu_bandwidth_gb_s=0.001,
        )
        assert tps < 0.01  # Effectively zero

    def test_q4_faster_than_fp16(self) -> None:
        """Q4 model should have higher TPS than FP16 model (same params)."""
        tps_q4 = estimate_tps(
            num_params=8_000_000_000,
            batch_size=1,
            gpu_flops=12.74e12,
            gpu_bandwidth_gb_s=360.0,
            quantization_bits=4,
        )
        tps_fp16 = estimate_tps(
            num_params=8_000_000_000,
            batch_size=1,
            gpu_flops=12.74e12,
            gpu_bandwidth_gb_s=360.0,
            quantization_bits=16,
        )
        assert tps_q4 > tps_fp16

    def test_tps_capped_at_100(self) -> None:
        """TPS should never exceed 100 (realistic consumer GPU ceiling)."""
        tps = estimate_tps(
            num_params=600_000_000,  # 0.6B model
            batch_size=1,
            gpu_flops=312.0e12 * 2.0,  # A100 FP16
            gpu_bandwidth_gb_s=2039.0,  # A100 bandwidth
            quantization_bits=4,
        )
        assert tps <= 100.0
        assert tps == 100.0  # Should hit the cap

    def test_quantization_affects_tpot(self) -> None:
        """TPOT should decrease with lower quantization bits."""
        tpot_q4 = estimate_tpot(
            num_params=8_000_000_000,
            batch_size=1,
            gpu_flops=12.74e12,
            gpu_bandwidth_gb_s=360.0,
            quantization_bits=4,
        )
        tpot_q8 = estimate_tpot(
            num_params=8_000_000_000,
            batch_size=1,
            gpu_flops=12.74e12,
            gpu_bandwidth_gb_s=360.0,
            quantization_bits=8,
        )
        assert tpot_q4 < tpot_q8
