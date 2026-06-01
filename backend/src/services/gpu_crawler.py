"""GPU crawler — loads GPU specs from dbgpu offline database and upserts into PostgreSQL.

Architecture:
    Pure transformation functions + a single orchestrator (crawl_gpus)
    that receives a SQLAlchemy Session. The dbgpu library provides an
    offline SQLite database of TechPowerUp specs — no network requests.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import insert as pg_insert

from src.models import GpuSpec

logger = logging.getLogger(__name__)

# ── Tier assignment ─────────────────────────────────────────────

def assign_tier(vram_gb: float, flops_tflops: float | None) -> str:
    """Classify a GPU into a performance tier.

    Thresholds are designed for consumer LLM inference workloads:
        enthusiast: 32GB+ VRAM  or  40+ TFLOPS (FP32)
        high:       16GB+ VRAM  or  25+ TFLOPS
        mid:         8GB+ VRAM  or   8+ TFLOPS
        entry:      everything below
    """
    flops = flops_tflops or 0.0
    if vram_gb >= 32 or flops >= 40:
        return "enthusiast"
    if vram_gb >= 16 or flops >= 25:
        return "high"
    if vram_gb >= 8 or flops >= 8:
        return "mid"
    return "entry"


# ── Slug generation ─────────────────────────────────────────────

def generate_gpu_slug(vendor: str, name: str, vram_gb: float) -> str:
    """Generate a deterministic, human-readable GPU slug.

    Example:
        ("nvidia", "GeForce RTX 4090", 24.0) → "gpu-nvidia-rtx-4090-24gb"
        ("amd", "Radeon RX 7900 XTX", 24.0) → "gpu-amd-rx-7900-xtx-24gb"
    """
    normalized = name.lower().replace(" ", "-").replace("_", "-")
    vendor_part = vendor.lower()
    return f"gpu-{vendor_part}-{normalized}-{int(vram_gb)}gb"


# ── Field mapping ───────────────────────────────────────────────

_VENDOR_NORMALIZE: dict[str, str] = {
    "NVIDIA": "nvidia",
    "AMD": "amd",
    "Intel": "intel",
    "Apple": "apple",
}


def map_dbgpu_to_record(spec) -> dict:
    """Map a dbgpu GPUSpecification to our GpuSpec ORM dict.

    Every field is explicitly mapped — no implicit conversion.
    """
    vendor_raw = spec.manufacturer or "unknown"
    vendor = _VENDOR_NORMALIZE.get(vendor_raw, vendor_raw.lower())

    vram_gb = float(spec.memory_size_gb) if spec.memory_size_gb else 0.0

    # FP32 TFLOPS from GFLOPS
    flops_tflops: float | None = None
    if spec.single_float_performance_gflop_s:
        flops_tflops = round(spec.single_float_performance_gflop_s / 1000.0, 2)

    bandwidth: float | None = None
    if spec.memory_bandwidth_gb_s:
        bandwidth = round(float(spec.memory_bandwidth_gb_s), 1)

    tier = assign_tier(vram_gb, flops_tflops)
    slug = generate_gpu_slug(vendor, spec.name, vram_gb)

    return {
        "slug": slug,
        "name": spec.name,
        "vendor": vendor,
        "vram_gb": vram_gb,
        "benchmark_score": None,  # dbgpu doesn't provide benchmark scores
        "flops_tflops": flops_tflops,
        "memory_bandwidth_gb_s": bandwidth,
        "tier": tier,
    }


# ── Consumer GPU filter ─────────────────────────────────────────

_CONSUMER_PREFIXES = (
    "geforce", "radeon", "arc", "apple m",
    "rtx", "gtx", "rx", "firepro",
)


def _is_consumer_gpu(spec) -> bool:
    """Filter out workstation/server/data-center GPUs.

    Keeps consumer cards + Apple Silicon. Excludes:
    - Workstation lines: Quadro, Tesla, Radeon Pro, Instinct
    - Data center: anything >48 GB VRAM, or with 'server'/'data center' in name
    """
    name_lower = spec.name.lower()
    vram = spec.memory_size_gb or 0

    # Data center / server cards (over 48 GB is server territory)
    if vram > 48:
        return False

    # Exclude known workstation/server lines
    _exclude = (
        "quadro", "tesla", "grid", "firepro",
        "radeon pro", "instinct", "server", "data center",
        "max-q",  # mobile workstation variants
    )
    if any(x in name_lower for x in _exclude):
        return False

    # Include consumer lines + Apple Silicon
    return any(name_lower.startswith(p) for p in _CONSUMER_PREFIXES) or spec.manufacturer == "Apple"


# ── Main orchestrator ───────────────────────────────────────────

def crawl_gpus(
    session,
    *,
    vendors: list[str] | None = None,
    dry_run: bool = False,
) -> int:
    """Load GPU specs from dbgpu and upsert into the database.

    Args:
        session: SQLAlchemy Session (caller manages lifecycle).
        vendors: Optional filter list (e.g. ["nvidia", "amd"]).
        dry_run: If True, log records without writing to DB.

    Returns:
        Number of GPU records processed.
    """
    from dbgpu import GPUDatabase

    db = GPUDatabase.default()
    now = datetime.now(timezone.utc)
    count = 0

    logger.info("Loading GPU specs from dbgpu (%d entries)...", len(db.specs))

    for spec in db.specs:
        vendor_raw = spec.manufacturer or ""
        vendor_norm = _VENDOR_NORMALIZE.get(vendor_raw, vendor_raw.lower())

        # Vendor filter
        if vendors and vendor_norm not in vendors:
            continue

        # Consumer GPU filter
        if not _is_consumer_gpu(spec):
            continue

        # VRAM requirement — skip GPUs with < 2 GB (minimum for any LLM)
        if not spec.memory_size_gb or spec.memory_size_gb < 2.0:
            continue

        record = map_dbgpu_to_record(spec)

        if dry_run:
            logger.info(
                "  [DRY-RUN] %s | tier=%s | VRAM=%.0fGB | TFLOPs=%s",
                record["slug"], record["tier"],
                record["vram_gb"], record["flops_tflops"],
            )
        else:
            stmt = (
                pg_insert(GpuSpec)
                .values(**record, created_at=now, updated_at=now)
                .on_conflict_do_update(
                    index_elements=[GpuSpec.slug],
                    set_={
                        "name": record["name"],
                        "vendor": record["vendor"],
                        "vram_gb": record["vram_gb"],
                        "benchmark_score": record["benchmark_score"],
                        "flops_tflops": record["flops_tflops"],
                        "memory_bandwidth_gb_s": record["memory_bandwidth_gb_s"],
                        "tier": record["tier"],
                        "updated_at": now,
                    },
                )
            )
            session.execute(stmt)
        count += 1

    if not dry_run:
        session.commit()

    logger.info("Processed %d GPU records.", count)
    return count
