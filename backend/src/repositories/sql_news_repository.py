"""SQL (PostgreSQL) implementation of INewsRepository."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models import NewsPost
from src.repositories.interfaces import INewsRepository


class SqlNewsRepository(INewsRepository):
    """News repository backed by a SQL database."""

    def __init__(self, session: Session) -> None:
        self._session = session

    # ── Public (published only) ─────────────────────────────────────

    def list_published(
        self,
        page: int = 1,
        size: int = 12,
        category: str | None = None,
    ) -> dict:
        base = select(NewsPost).where(
            NewsPost.is_published.is_(True)
        )
        if category:
            base = base.where(func.lower(NewsPost.category) == category.lower())

        count_q = select(func.count()).select_from(base.subquery())
        total = self._session.scalar(count_q) or 0

        offset = (page - 1) * size
        rows = self._session.execute(
            base.order_by(NewsPost.published_at.desc().nullslast())
            .offset(offset)
            .limit(size)
        ).scalars().all()

        return {
            "items": [self._to_list_item(r) for r in rows],
            "total": total,
            "page": page,
            "size": size,
        }

    def get_by_slug(self, slug: str) -> dict | None:
        row = self._session.execute(
            select(NewsPost).where(
                NewsPost.slug == slug,
                NewsPost.is_published.is_(True),
            )
        ).scalar_one_or_none()
        return self._to_detail(row) if row else None

    # ── Admin (includes drafts) ─────────────────────────────────────

    def list_all(
        self,
        page: int = 1,
        size: int = 20,
        include_drafts: bool = True,
    ) -> dict:
        base = select(NewsPost)
        if not include_drafts:
            base = base.where(NewsPost.is_published.is_(True))

        count_q = select(func.count()).select_from(base.subquery())
        total = self._session.scalar(count_q) or 0

        offset = (page - 1) * size
        rows = self._session.execute(
            base.order_by(NewsPost.created_at.desc())
            .offset(offset)
            .limit(size)
        ).scalars().all()

        return {
            "items": [self._to_list_item(r) for r in rows],
            "total": total,
            "page": page,
            "size": size,
        }

    def get_by_slug_admin(self, slug: str) -> dict | None:
        row = self._session.execute(
            select(NewsPost).where(NewsPost.slug == slug)
        ).scalar_one_or_none()
        return self._to_detail(row) if row else None

    # ── CRUD ────────────────────────────────────────────────────────

    def create(self, data: dict) -> dict:
        now = datetime.now(timezone.utc)

        post = NewsPost(
            id=uuid4(),
            slug=data["slug"],
            title=data["title"],
            summary=data["summary"],
            body_markdown=data["body_markdown"],
            category=data.get("category", "guide"),
            tags=data.get("tags", ""),
            cover_image_url=data.get("cover_image_url", ""),
            is_published=data.get("is_published", False),
            published_at=now if data.get("is_published") else None,
            created_at=now,
            updated_at=now,
        )
        self._session.add(post)
        self._session.flush()
        return self._to_detail(post)

    def update(self, slug: str, data: dict) -> dict | None:
        row = self._session.execute(
            select(NewsPost).where(NewsPost.slug == slug)
        ).scalar_one_or_none()
        if row is None:
            return None

        for field in (
            "title", "summary", "body_markdown",
            "category", "tags", "cover_image_url",
        ):
            if field in data:
                setattr(row, field, data[field])

        if "is_published" in data:
            row.is_published = data["is_published"]
            if data["is_published"] and row.published_at is None:
                row.published_at = datetime.now(timezone.utc)
            elif not data["is_published"]:
                row.published_at = None

        row.updated_at = datetime.now(timezone.utc)
        self._session.flush()
        return self._to_detail(row)

    def delete(self, slug: str) -> bool:
        row = self._session.execute(
            select(NewsPost).where(NewsPost.slug == slug)
        ).scalar_one_or_none()
        if row is None:
            return False
        self._session.delete(row)
        self._session.flush()
        return True

    # ── Helpers ─────────────────────────────────────────────────────

    @staticmethod
    def _to_list_item(post: NewsPost) -> dict:
        return {
            "id": str(post.id),
            "slug": post.slug,
            "title": post.title,
            "summary": post.summary,
            "category": post.category,
            "tags": post.tags,
            "cover_image_url": post.cover_image_url,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "created_at": post.created_at.isoformat() if post.created_at else "",
            "updated_at": post.updated_at.isoformat() if post.updated_at else "",
        }

    @staticmethod
    def _to_detail(post: NewsPost) -> dict:
        return {
            "id": str(post.id),
            "slug": post.slug,
            "title": post.title,
            "summary": post.summary,
            "body_markdown": post.body_markdown,
            "category": post.category,
            "tags": post.tags,
            "cover_image_url": post.cover_image_url,
            "is_published": post.is_published,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "created_at": post.created_at.isoformat() if post.created_at else "",
            "updated_at": post.updated_at.isoformat() if post.updated_at else "",
        }
