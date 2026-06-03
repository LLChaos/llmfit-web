"""JSON file fallback implementation of INewsRepository.

Used when the database is not available (dev mode without PostgreSQL).
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


class JsonNewsRepository:
    """JSON-backed news repository for development.

    Writes to a single JSON file. Not suitable for production use.
    """

    def __init__(self, file_path: str) -> None:
        self._file_path = file_path
        self._ensure_file()

    # ── File management ─────────────────────────────────────────────

    def _ensure_file(self) -> None:
        path = Path(self._file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_text("[]", encoding="utf-8")

    def _read_all(self) -> list[dict]:
        with open(self._file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_all(self, posts: list[dict]) -> None:
        with open(self._file_path, "w", encoding="utf-8") as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)

    # ── Public (published only) ─────────────────────────────────────

    def list_published(
        self,
        page: int = 1,
        size: int = 12,
        category: str | None = None,
    ) -> dict:
        posts = self._read_all()
        posts = [p for p in posts if p.get("is_published")]
        if category:
            posts = [p for p in posts if p.get("category", "").lower() == category.lower()]
        posts.sort(key=lambda p: p.get("published_at") or "", reverse=True)

        total = len(posts)
        start = (page - 1) * size
        items = posts[start:start + size]
        return {"items": items, "total": total, "page": page, "size": size}

    def get_by_slug(self, slug: str) -> dict | None:
        posts = self._read_all()
        for p in posts:
            if p.get("slug") == slug and p.get("is_published"):
                return p
        return None

    # ── Admin (includes drafts) ─────────────────────────────────────

    def list_all(
        self,
        page: int = 1,
        size: int = 20,
        include_drafts: bool = True,
    ) -> dict:
        posts = self._read_all()
        if not include_drafts:
            posts = [p for p in posts if p.get("is_published")]
        posts.sort(key=lambda p: p.get("created_at") or "", reverse=True)

        total = len(posts)
        start = (page - 1) * size
        items = posts[start:start + size]
        return {"items": items, "total": total, "page": page, "size": size}

    def get_by_slug_admin(self, slug: str) -> dict | None:
        posts = self._read_all()
        for p in posts:
            if p.get("slug") == slug:
                return p
        return None

    # ── CRUD ────────────────────────────────────────────────────────

    def create(self, data: dict) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        post = {
            "id": str(uuid4()),
            "slug": data["slug"],
            "title": data["title"],
            "summary": data["summary"],
            "body_markdown": data["body_markdown"],
            "category": data.get("category", "guide"),
            "tags": data.get("tags", ""),
            "cover_image_url": data.get("cover_image_url", ""),
            "is_published": data.get("is_published", False),
            "published_at": now if data.get("is_published") else None,
            "created_at": now,
            "updated_at": now,
        }
        posts = self._read_all()
        posts.append(post)
        self._write_all(posts)
        return post

    def update(self, slug: str, data: dict) -> dict | None:
        posts = self._read_all()
        now = datetime.now(timezone.utc).isoformat()
        for i, p in enumerate(posts):
            if p.get("slug") == slug:
                for field in (
                    "title", "summary", "body_markdown",
                    "category", "tags", "cover_image_url",
                ):
                    if field in data:
                        posts[i][field] = data[field]
                if "is_published" in data:
                    posts[i]["is_published"] = data["is_published"]
                    if data["is_published"] and not posts[i].get("published_at"):
                        posts[i]["published_at"] = now
                    elif not data["is_published"]:
                        posts[i]["published_at"] = None
                posts[i]["updated_at"] = now
                self._write_all(posts)
                return posts[i]
        return None

    def delete(self, slug: str) -> bool:
        posts = self._read_all()
        original_len = len(posts)
        posts = [p for p in posts if p.get("slug") != slug]
        if len(posts) == original_len:
            return False
        self._write_all(posts)
        return True
