"""Seed the database with mock JSON data.

Usage:
    python -m scripts.seed           # seed all
    python -m scripts.seed --dry-run # preview only
"""

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert as pg_insert

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent / "src" / "data"
_MODELS_PATH = _DATA_DIR / "mock_models.json"
_GPUS_PATH = _DATA_DIR / "mock_gpu_specs.json"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def seed_models(session, dry_run: bool = False) -> int:
    """Insert model records from mock_models.json. Returns count."""
    with open(_MODELS_PATH, encoding="utf-8") as f:
        records = json.load(f)

    if dry_run:
        for r in records:
            logger.info("  [DRY-RUN] model: %s", r["id"])
        return len(records)

    from src.models import Model

    now = _utcnow()
    count = 0
    for r in records:
        stmt = (
            pg_insert(Model)
            .values(
                slug=r["id"],
                family=r["family"],
                name=r["name"],
                parameter_count_b=r["parameter_count_b"],
                quantization=r["quantization"],
                quantization_bits=r["quantization_bits"],
                min_vram_gb=r["min_vram_gb"],
                recommended_vram_gb=r["recommended_vram_gb"],
                context_length=r["context_length"],
                hidden_dim=r.get("hidden_dim", 0),
                num_layers=r.get("num_layers", 0),
                quality_score=r["quality_score"],
                download_url=r["download_url"],
                huggingface_repo=r["huggingface_repo"],
                created_at=now,
                updated_at=now,
            )
            .on_conflict_do_update(
                index_elements=[Model.slug],
                set_={
                    "name": r["name"],
                    "parameter_count_b": r["parameter_count_b"],
                    "quantization": r["quantization"],
                    "quantization_bits": r["quantization_bits"],
                    "min_vram_gb": r["min_vram_gb"],
                    "recommended_vram_gb": r["recommended_vram_gb"],
                    "context_length": r["context_length"],
                    "hidden_dim": r.get("hidden_dim", 0),
                    "num_layers": r.get("num_layers", 0),
                    "quality_score": r["quality_score"],
                    "download_url": r["download_url"],
                    "huggingface_repo": r["huggingface_repo"],
                    "updated_at": now,
                },
            )
        )
        session.execute(stmt)
        count += 1

    session.commit()
    return count


def seed_gpus(session, dry_run: bool = False) -> int:
    """Insert GPU records from mock_gpu_specs.json. Returns count."""
    with open(_GPUS_PATH, encoding="utf-8") as f:
        records = json.load(f)

    if dry_run:
        for r in records:
            logger.info("  [DRY-RUN] gpu: %s", r["id"])
        return len(records)

    from src.models import GpuSpec

    now = _utcnow()
    count = 0
    for r in records:
        stmt = (
            pg_insert(GpuSpec)
            .values(
                slug=r["id"],
                name=r["name"],
                vendor=r["vendor"],
                vram_gb=r["vram_gb"],
                benchmark_score=r.get("benchmark_score"),
                flops_tflops=r.get("flops_tflops"),
                memory_bandwidth_gb_s=r.get("memory_bandwidth_gb_s"),
                tier=r["tier"],
                created_at=now,
                updated_at=now,
            )
            .on_conflict_do_update(
                index_elements=[GpuSpec.slug],
                set_={
                    "name": r["name"],
                    "vendor": r["vendor"],
                    "vram_gb": r["vram_gb"],
                    "benchmark_score": r.get("benchmark_score"),
                    "flops_tflops": r.get("flops_tflops"),
                    "memory_bandwidth_gb_s": r.get("memory_bandwidth_gb_s"),
                    "tier": r["tier"],
                    "updated_at": now,
                },
            )
        )
        session.execute(stmt)
        count += 1

    session.commit()
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the database from JSON files.")
    parser.add_argument("--dry-run", action="store_true", help="Preview only.")
    parser.add_argument(
        "--url",
        default=None,
        help="Override SYNC_DATABASE_URL (default: from .env).",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    # Resolve DB URL
    if args.url:
        db_url = args.url
    else:
        from src.core.config import settings
        db_url = settings.sync_database_url

    if not db_url:
        logger.error("SYNC_DATABASE_URL is empty. Set it in .env or pass --url.")
        sys.exit(1)

    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    engine = create_engine(db_url)
    from src.models import Base
    Base.metadata.create_all(engine)  # ensure tables exist

    with Session(engine) as session:
        n_models = seed_models(session, dry_run=args.dry_run)
        n_gpus = seed_gpus(session, dry_run=args.dry_run)

    if args.dry_run:
        logger.info("Dry-run complete. Would seed %d models + %d GPUs.", n_models, n_gpus)
    else:
        logger.info("Seeded %d models + %d GPUs.", n_models, n_gpus)


if __name__ == "__main__":
    main()
