"""Speed scorer — estimates inference speed (TPS) and converts to 0-100 score.

Weight: 25% of total recommendation score.

Formula (from Jinghong Chen):
    TPOT = Decode_Compute / GPU_FLOPs + (2*N) / GPU_BW
    TPS ≈ 1 / TPOT
    Score = min(100, (TPS / 20) * 100)
"""

from src.utils.vram import estimate_tps


def score_speed(model: dict[str, object], gpu: dict[str, object]) -> float:
    """Calculate speed score based on estimated tokens per second.

    Args:
        model: Model spec dict with 'parameter_count_b' key.
        gpu: GPU spec dict with 'flops_tflops' and 'memory_bandwidth_gb_s' keys.

    Returns:
        Speed score 0-100 (100 = 20+ TPS).
    """
    num_params = int(model["parameter_count_b"] * 1e9)  # type: ignore[operator]
    gpu_flops = gpu["flops_tflops"] * 1e12  # type: ignore[operator]
    gpu_bandwidth = gpu["memory_bandwidth_gb_s"]  # type: ignore[operator]

    tps = estimate_tps(
        num_params=num_params,  # type: ignore[arg-type]
        batch_size=1,
        gpu_flops=gpu_flops,  # type: ignore[arg-type]
        gpu_bandwidth_gb_s=gpu_bandwidth,  # type: ignore[arg-type]
    )

    return min(100.0, (tps / 20.0) * 100.0)
