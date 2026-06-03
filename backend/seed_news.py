"""Seed the news_posts table with initial articles.

Usage:
    # SQL mode (requires SYNC_DATABASE_URL in .env):
    python backend/seed_news.py

    # JSON mode (writes to backend/src/data/news_posts.json):
    python backend/seed_news.py --json
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure backend is importable
sys.path.insert(0, str(Path(__file__).resolve().parent))


def seed_json(data_dir: str) -> None:
    """Copy the seed JSON to the data directory as news_posts.json."""
    seed_path = os.path.join(data_dir, "news_posts.json")
    dest_path = os.path.join(data_dir, "..", "news_posts.json")

    if os.path.exists(dest_path):
        print(f"JSON file already exists at {dest_path}. Delete it first to re-seed.")
        return

    import shutil
    shutil.copy(seed_path, dest_path)
    print(f"Seeded {dest_path} with initial articles.")


def seed_sql() -> None:
    """Insert seed articles into the PostgreSQL database."""
    from src.core.config import settings
    from src.core.database import SyncSessionLocal
    from src.models import NewsPost

    if not settings.sync_database_url:
        print("SYNC_DATABASE_URL is not set. Use --json mode or configure your .env.")
        sys.exit(1)

    if SyncSessionLocal is None:
        print("SyncSessionLocal is not configured. Check your database setup.")
        sys.exit(1)

    # Load seed data from the same directory as this script
    seed_path = os.path.join(os.path.dirname(__file__), "src", "data", "news_posts.json")
    with open(seed_path, "r", encoding="utf-8") as f:
        articles = json.load(f)

    session = SyncSessionLocal()
    try:
        for article in articles:
            # Skip if already exists
            existing = session.execute(
                __import__("sqlalchemy").select(NewsPost).where(
                    NewsPost.slug == article["slug"]
                )
            ).scalar_one_or_none()

            if existing:
                print(f"  Skipping {article['slug']} (already exists)")
                continue

            post = NewsPost(
                slug=article["slug"],
                title=article["title"],
                summary=article["summary"],
                body_markdown=article["body_markdown"],
                category=article["category"],
                tags=article["tags"],
                cover_image_url=article.get("cover_image_url", ""),
                is_published=article.get("is_published", True),
                published_at=datetime.fromisoformat(article["published_at"].replace("+00:00", "+00:00")) if article.get("published_at") else None,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(post)
            print(f"  Created: {article['slug']}")

        session.commit()
        print(f"\nSeeded {len(articles)} articles into the database.")
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        session.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed news_posts with initial articles.")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Write to JSON file (fallback mode) instead of database.",
    )
    args = parser.parse_args()

    data_dir = os.path.join(os.path.dirname(__file__), "src", "data")

    if args.json:
        seed_json(data_dir)
    else:
        seed_sql()


if __name__ == "__main__":
    main()
