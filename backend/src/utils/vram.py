"""VRAM estimation utility functions.

Formulas from:
- Jinghong Chen: https://www.jinghong-chen.net/estimate-vram-usage-in-llm-inference/
- deep-research-report.md
"""


def estimate_vram_simple(
    parameter_count_b: float,
    quantization_bits: int = 16,
    overhead: float = 0.2,
) -> float:
    """Quick VRAM estimate for filtering.

    Formula: VRAM_GB = P * (Q_bits / 8) * (1 + overhead)

    Args:
        parameter_count_b: Parameters in billions.
        quantization_bits: Quantization bit width (4, 8, or 16).
        overhead: KV cache + framework overhead factor (default 0.2 = 20%).

    Returns:
        Estimated VRAM in GB.
    """
    return parameter_count_b * (quantization_bits / 8.0) * (1.0 + overhead)


def estimate_vram_precise(
    num_params: int,
    hidden_dim: int,
    num_layers: int,
    batch_size: int = 1,
    sequence_length: int = 4096,
) -> float:
    """Precise VRAM estimate using Jinghong Chen's formula.

    Formula: VRAM = N*2 + 2*h*L*b*s*2

    Args:
        num_params: Total number of parameters.
        hidden_dim: Hidden dimension size.
        num_layers: Number of transformer layers.
        batch_size: Batch size (default 1 for single-user inference).
        sequence_length: Context sequence length.

    Returns:
        Estimated VRAM in bytes.
    """
    model_weights_bytes = num_params * 2  # 16-bit precision
    kv_cache_bytes = 2 * hidden_dim * num_layers * batch_size * sequence_length * 2
    return model_weights_bytes + kv_cache_bytes


def bytes_to_gb(num_bytes: float) -> float:
    """Convert bytes to gigabytes."""
    return num_bytes / (1024**3)


def estimate_tpot(
    num_params: int,
    batch_size: int,
    gpu_flops: float,
    gpu_bandwidth_gb_s: float,
) -> float:
    """Estimate Time Per Output Token (TPOT) in seconds.

    From Jinghong Chen:
        Decode Compute = 2 * N * b * 1
        TPOT = Decode_Compute / GPU_FLOPs + (2 * N) / GPU_BW

    Args:
        num_params: Total number of parameters.
        batch_size: Batch size.
        gpu_flops: GPU FLOPs rate (operations per second).
        gpu_bandwidth_gb_s: GPU memory bandwidth in GB/s.

    Returns:
        Estimated seconds per token.
    """
    decode_compute = 2 * num_params * batch_size * 1
    gpu_bandwidth_bytes_s = gpu_bandwidth_gb_s * 1024**3
    tpot = (decode_compute / gpu_flops) + ((2 * num_params) / gpu_bandwidth_bytes_s)
    return tpot


def estimate_tps(
    num_params: int,
    batch_size: int,
    gpu_flops: float,
    gpu_bandwidth_gb_s: float,
) -> float:
    """Estimate tokens per second (decode phase).

    Args:
        num_params: Total number of parameters.
        batch_size: Batch size.
        gpu_flops: GPU FLOPs rate.
        gpu_bandwidth_gb_s: GPU memory bandwidth in GB/s.

    Returns:
        Estimated tokens per second.
    """
    tpot = estimate_tpot(num_params, batch_size, gpu_flops, gpu_bandwidth_gb_s)
    if tpot <= 0:
        return 0.0
    return 1.0 / tpot
