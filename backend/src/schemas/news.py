"""News post Pydantic schemas."""

from datetime import datetime

from .common import BaseSchema


class NewsPostBase(BaseSchema):
    """Fields shared across news post schemas."""

    slug: str
    title: str
    summary: str
    category: str  # "news", "guide", "tutorial", "announcement"
    tags: str  # comma-separated
    cover_image_url: str = ""


class NewsPostListItem(NewsPostBase):
    """News post summary for list display — no full body."""

    id: str
    published_at: str | None = None
    created_at: str
    updated_at: str


class NewsPostDetail(NewsPostBase):
    """Full news post including Markdown body."""

    id: str
    body_markdown: str
    published_at: str | None = None
    is_published: bool
    created_at: str
    updated_at: str


class NewsPostCreate(BaseSchema):
    """Payload for creating a new news post."""

    slug: str
    title: str
    summary: str
    body_markdown: str
    category: str = "guide"
    tags: str = ""
    cover_image_url: str = ""
    is_published: bool = False


class NewsPostUpdate(BaseSchema):
    """Payload for updating an existing news post. All fields optional."""

    title: str | None = None
    summary: str | None = None
    body_markdown: str | None = None
    category: str | None = None
    tags: str | None = None
    cover_image_url: str | None = None
    is_published: bool | None = None
