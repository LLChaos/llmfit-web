"""Tests for speed scorer."""

from src.services.scoring.speed import score_speed


# Mock GPU with known performance parameters (RTX 3060 tier)
MOCK_GPU = {
    "flops_tflops": 12.74,
    "memory_bandwidth_gb_s": 360.0,
}

# Mock model: Qwen3 8B Q4
MOCK_MODEL = {
    "parameter_count_b": 8.0,
}


class TestScoreSpeed:
    def test_returns_value_between_0_and_100(self) -> None:
        """Speed score must be clamped to 0-100 range."""
        result = score_speed(MOCK_MODEL, MOCK_GPU)
        assert 0 <= result <= 100

    def test_faster_gpu_gives_higher_score(self) -> None:
        """A more powerful GPU should yield a higher speed score."""
        slow_gpu = {"flops_tflops": 2.98, "memory_bandwidth_gb_s": 128.0}
        fast_gpu = {"flops_tflops": 82.58, "memory_bandwidth_gb_s": 1008.0}

        score_slow = score_speed(MOCK_MODEL, slow_gpu)
        score_fast = score_speed(MOCK_MODEL, fast_gpu)
        assert score_fast > score_slow

    def test_smaller_model_gives_higher_score(self) -> None:
        """A smaller model should yield higher TPS -> higher speed score."""
        small_model = {"parameter_count_b": 1.8}
        large_model = {"parameter_count_b": 32.0}

        score_small = score_speed(small_model, MOCK_GPU)
        score_large = score_speed(large_model, MOCK_GPU)
        assert score_small > score_large

    def test_tps_at_20_gives_100(self) -> None:
        """TPS >= 20 should cap at 100 (reading speed threshold)."""
        tiny_model = {"parameter_count_b": 0.6}
        beast_gpu = {"flops_tflops": 312.0, "memory_bandwidth_gb_s": 2039.0}
        result = score_speed(tiny_model, beast_gpu)
        assert result == 100.0
