"""Speed scorer — estimates inference speed (TPS) and converts to 0-100 score.

Weight: 25% of total recommendation score.

Formula (from Jinghong Chen):
    TPOT = Decode_Compute / GPU_FLOPs + (Q_bits/8 * N) / GPU_BW + overhead
    TPS ≈ 1 / TPOT (capped at 100)
    Score = min(100, (TPS / BENCHMARK[tier]) * 100)

Uses GPU-tier benchmarks instead of pool-relative normalization so that
scores reflect absolute usability rather than relative ranking within
the candidate set.
"""

from src.utils.vram import estimate_tps

# TPS benchmarks per GPU tier — "excellent speed" threshold
TierBenchmark = dict[str, float]

TIER_BENCHMARK: TierBenchmark = {
    "entry": 40.0,       # GTX 1650 class
    "mid": 60.0,         # RTX 3060 class
    "high": 80.0,        # RTX 4090 class
    "enthusiast": 100.0, # A100 / RTX 5090 class
}

_DEFAULT_BENCHMARK = 60.0


def score_speed(
    model: dict[str, object],
    gpu: dict[str, object],
) -> float:
    """Calculate speed score relative to GPU tier benchmark.

    Args:
        model: Model spec dict with 'parameter_count_b' and 'quantization_bits'.
        gpu: GPU spec dict with 'flops_tflops', 'memory_bandwidth_gb_s', and 'tier'.

    Returns:
        Speed score 0-100. Returns a conservative estimate (10.0) when GPU
        performance data is unavailable (e.g. fallback GPU for unknown hardware).
    """
    gpu_flops_raw = gpu.get("flops_tflops")  # type: ignore[typeddict-item]
    gpu_bandwidth = gpu.get("memory_bandwidth_gb_s")  # type: ignore[typeddict-item]

    # Cannot compute TPS without GPU performance data — return conservative score
    if gpu_flops_raw is None or gpu_bandwidth is None:
        return 10.0

    num_params = int(model["parameter_count_b"] * 1e9)  # type: ignore[operator]
    quantization_bits = model["quantization_bits"]  # type: ignore[typeddict-item]
    gpu_tier = gpu.get("tier", "mid")  # type: ignore[typeddict-item]

    tps = estimate_tps(
        num_params=num_params,  # type: ignore[arg-type]
        batch_size=1,
        gpu_flops=gpu_flops_raw * 1e12 * 2.0,  # type: ignore[arg-type]
        gpu_bandwidth_gb_s=gpu_bandwidth,  # type: ignore[arg-type]
        quantization_bits=quantization_bits,  # type: ignore[arg-type]
    )

    benchmark = TIER_BENCHMARK.get(str(gpu_tier), _DEFAULT_BENCHMARK)  # type: ignore[arg-type]
    return min(100.0, (tps / benchmark) * 100.0)
