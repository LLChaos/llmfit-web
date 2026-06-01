"""CLI entry point for model crawling.

Usage:
    python -m scripts.crawl_models --limit 30
    python -m scripts.crawl_models --limit 10 --dry-run
    python -m scripts.crawl_models --families Qwen,Llama --token hf_xxx
"""

import argparse
import logging
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models import Base
from src.services.model_crawler import crawl_models

logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Crawl HuggingFace for LLM models and upsert into PostgreSQL."
    )
    parser.add_argument(
        "--limit", type=int, default=50,
        help="Max models to fetch from HF (default: 50).",
    )
    parser.add_argument(
        "--min-downloads", type=int, default=10000,
        help="Minimum downloads threshold (default: 10000).",
    )
    parser.add_argument(
        "--families", type=str, default=None,
        help="Comma-separated author/org filter (e.g. 'Qwen,Llama').",
    )
    parser.add_argument(
        "--token", type=str, default=None,
        help="HF API token for higher rate limits.",
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

    families = (
        [f.strip() for f in args.families.split(",") if f.strip()]
        if args.families else None
    )

    engine = create_engine(settings.sync_database_url, echo=settings.debug)
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        n = crawl_models(
            session,
            limit=args.limit,
            min_downloads=args.min_downloads,
            families=families,
            token=args.token,
            dry_run=args.dry_run,
        )

    if args.dry_run:
        logger.info("Dry-run complete. Would process ~%d records.", n)
    else:
        logger.info("Crawled and upserted %d model records.", n)


if __name__ == "__main__":
    main()
