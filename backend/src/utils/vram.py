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


# Effective bytes per parameter for memory bandwidth calculation.
# Raw theory: Q4=0.5, Q8=1.0, FP16=2.0 bytes/param.
# Reality: llama.cpp Q4_K_M decompression adds ~60% overhead,
# so effective bytes are higher than raw bit width suggests.
_EFFECTIVE_BYTES_PER_PARAM: dict[int, float] = {
    4: 0.8,   # Q4: 0.5 raw + decompression overhead
    8: 1.2,   # Q8: 1.0 raw + overhead
    16: 2.0,  # FP16: no overhead
}


def _get_effective_bytes(quantization_bits: int) -> float:
    """Map quantization bits to effective bytes per parameter."""
    return _EFFECTIVE_BYTES_PER_PARAM.get(
        quantization_bits, quantization_bits / 8.0
    )


def estimate_tpot(
    num_params: int,
    batch_size: int,
    gpu_flops: float,
    gpu_bandwidth_gb_s: float,
    quantization_bits: int = 16,
) -> float:
    """Estimate Time Per Output Token (TPOT) in seconds.

    From Jinghong Chen:
        Decode Compute = 2 * N * b * 1
        TPOT = Decode_Compute / GPU_FLOPs + (eff_bytes * N) / GPU_BW

    Uses effective bytes/param (not raw Q_bits/8) to account for
    real-world decompression overhead in inference frameworks.

    Args:
        num_params: Total number of parameters.
        batch_size: Batch size.
        gpu_flops: GPU FLOPs rate (operations per second, FP16).
        gpu_bandwidth_gb_s: GPU memory bandwidth in GB/s.
        quantization_bits: Model quantization bit width (4/8/16).

    Returns:
        Estimated seconds per token.
    """
    decode_compute = 2 * num_params * batch_size * 1
    gpu_bandwidth_bytes_s = gpu_bandwidth_gb_s * 1024**3
    quant_bytes_per_param = _get_effective_bytes(quantization_bits)
    tpot = (
        (decode_compute / gpu_flops)
        + ((quant_bytes_per_param * num_params) / gpu_bandwidth_bytes_s)
    )
    return tpot


def estimate_tps(
    num_params: int,
    batch_size: int,
    gpu_flops: float,
    gpu_bandwidth_gb_s: float,
    quantization_bits: int = 16,
) -> float:
    """Estimate tokens per second (decode phase), capped at 100 tok/s.

    Consumer GPU inference does not exceed ~100 tok/s in practice
    due to framework overhead, even for very small models.

    Args:
        num_params: Total number of parameters.
        batch_size: Batch size.
        gpu_flops: GPU FLOPs rate (FP16).
        gpu_bandwidth_gb_s: GPU memory bandwidth in GB/s.
        quantization_bits: Model quantization bit width (4/8/16).

    Returns:
        Estimated tokens per second (capped at 100).
    """
    tpot = estimate_tpot(
        num_params, batch_size, gpu_flops, gpu_bandwidth_gb_s, quantization_bits
    )
    if tpot <= 0:
        return 0.0
    return min(1.0 / tpot, 100.0)
