"""CLI entry point for GPU crawling.

Usage:
    python -m scripts.crawl_gpus
    python -m scripts.crawl_gpus --dry-run
    python -m scripts.crawl_gpus --vendors nvidia,amd
"""

import argparse
import logging
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models import Base
from src.services.gpu_crawler import crawl_gpus

logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Load GPU specs from dbgpu and upsert into PostgreSQL."
    )
    parser.add_argument(
        "--vendors", type=str, default=None,
        help="Comma-separated vendor filter (e.g. 'nvidia,amd').",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview records without writing to the database.",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    if not settings.sync_database_url:
        logger.error("SYNC_DATABASE_URL is empty. Set it in .env.")
        sys.exit(1)

    vendors = (
        [v.strip() for v in args.vendors.split(",") if v.strip()]
        if args.vendors else None
    )

    engine = create_engine(settings.sync_database_url, echo=settings.debug)
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        n = crawl_gpus(
            session,
            vendors=vendors,
            dry_run=args.dry_run,
        )

    if args.dry_run:
        logger.info("Dry-run complete. Would process ~%d records.", n)
    else:
        logger.info("Crawled and upserted %d GPU records.", n)


if __name__ == "__main__":
    main()
