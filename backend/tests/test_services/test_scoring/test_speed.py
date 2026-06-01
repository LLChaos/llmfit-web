"""Tests for speed scorer."""

from src.services.scoring.speed import score_speed


# Mock GPU with known performance parameters (RTX 3060 tier)
MOCK_GPU = {
    "flops_tflops": 12.74,
    "memory_bandwidth_gb_s": 360.0,
    "tier": "mid",
}

# Mock model: Qwen3 8B Q4 — now includes quantization_bits
MOCK_MODEL = {
    "parameter_count_b": 8.0,
    "quantization_bits": 4,
}


class TestScoreSpeed:
    def test_returns_value_between_0_and_100(self) -> None:
        """Speed score must be clamped to 0-100 range."""
        result = score_speed(MOCK_MODEL, MOCK_GPU)
        assert 0 <= result <= 100

    def test_faster_gpu_gives_higher_score(self) -> None:
        """A more powerful GPU should yield a higher speed score."""
        # Use 32B model so TPS doesn't hit the 100 cap
        large_model = {"parameter_count_b": 32.0, "quantization_bits": 4}
        slow_gpu = {
            "flops_tflops": 2.98,
            "memory_bandwidth_gb_s": 128.0,
            "tier": "entry",
        }
        fast_gpu = {
            "flops_tflops": 82.58,
            "memory_bandwidth_gb_s": 1008.0,
            "tier": "high",
        }

        score_slow = score_speed(large_model, slow_gpu)
        score_fast = score_speed(large_model, fast_gpu)
        assert score_fast > score_slow

    def test_smaller_model_gives_higher_score(self) -> None:
        """A smaller model should yield higher TPS -> higher speed score."""
        small_model = {"parameter_count_b": 1.8, "quantization_bits": 4}
        large_model = {"parameter_count_b": 32.0, "quantization_bits": 4}

        score_small = score_speed(small_model, MOCK_GPU)
        score_large = score_speed(large_model, MOCK_GPU)
        assert score_small > score_large

    def test_q8_slower_than_q4_same_model(self) -> None:
        """Q8 model should yield lower TPS -> lower speed score than Q4."""
        q4_model = {"parameter_count_b": 8.0, "quantization_bits": 4}
        q8_model = {"parameter_count_b": 8.0, "quantization_bits": 8}

        score_q4 = score_speed(q4_model, MOCK_GPU)
        score_q8 = score_speed(q8_model, MOCK_GPU)
        assert score_q4 > score_q8

    def test_enthusiast_tier_has_higher_benchmark(self) -> None:
        """Enthusiast tier uses 100 TPS benchmark, same model scores lower."""
        # Use 70B model — even on 4090-class this won't hit the 100 cap
        model_70b = {"parameter_count_b": 70.0, "quantization_bits": 4}
        mid_gpu = {
            "flops_tflops": 82.58,
            "memory_bandwidth_gb_s": 1008.0,
            "tier": "mid",
        }
        enthusiast_gpu = {
            "flops_tflops": 82.58,
            "memory_bandwidth_gb_s": 1008.0,
            "tier": "enthusiast",
        }

        # Same TPS but stricter benchmark (100 vs 60) → lower score
        score_mid = score_speed(model_70b, mid_gpu)
        score_enth = score_speed(model_70b, enthusiast_gpu)
        assert score_mid > score_enth

    def test_tps_capped_at_100(self) -> None:
        """Small model on enthusiast GPU should cap at 100."""
        tiny_model = {"parameter_count_b": 0.6, "quantization_bits": 4}
        beast_gpu = {
            "flops_tflops": 312.0,
            "memory_bandwidth_gb_s": 2039.0,
            "tier": "enthusiast",
        }
        result = score_speed(tiny_model, beast_gpu)
        # TPS capped at 100, benchmark 80 → 100/80*100 = 125 → capped to 100
        assert result == 100.0

    def test_default_tier_when_missing(self) -> None:
        """GPU without tier field defaults to mid (40 TPS benchmark)."""
        gpu_no_tier = {
            "flops_tflops": 12.74,
            "memory_bandwidth_gb_s": 360.0,
        }
        result = score_speed(MOCK_MODEL, gpu_no_tier)
        assert 0 <= result <= 100
