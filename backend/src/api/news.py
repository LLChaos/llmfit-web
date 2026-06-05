"""News endpoints — public list/detail + admin CRUD.

Admin auth: all /admin/* endpoints require header X-Admin-Password.
Rate limiting for admin is enforced by the admin_dependency.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request

from src.api.dependencies import get_news_repo
from src.repositories.interfaces import INewsRepository
from src.schemas.common import ApiResponse
from src.schemas.news import (
    NewsPostCreate,
    NewsPostDetail,
    NewsPostListItem,
    NewsPostUpdate,
)

router = APIRouter(prefix="/news", tags=["news"])
admin_router = APIRouter(prefix="/admin/news", tags=["admin"])


# ── Rate limiter (simple in-memory, per-IP) ────────────────────────

_rate_limit_store: dict[str, list[float]] = {}
_MAX_FAILURES = 5
_BAN_SECONDS = 900  # 15 minutes


def _check_admin_rate_limit(ip: str) -> None:
    """Check if this IP has exceeded the admin rate limit."""
    import time
    now = time.time()
    attempts = _rate_limit_store.get(ip, [])
    # Prune old attempts
    recent = [t for t in attempts if now - t < _BAN_SECONDS]
    if len(recent) >= _MAX_FAILURES:
        raise HTTPException(
            status_code=429,
            detail={"message": "Too many login attempts. Please wait 15 minutes."},
        )
    _rate_limit_store[ip] = recent


def _record_admin_failure(ip: str) -> None:
    """Record a failed admin auth attempt."""
    import time
    now = time.time()
    attempts = _rate_limit_store.get(ip, [])
    recent = [t for t in attempts if now - t < _BAN_SECONDS]
    recent.append(now)
    _rate_limit_store[ip] = recent


def _clear_admin_rate_limit(ip: str) -> None:
    """Clear rate limit on successful auth."""
    _rate_limit_store.pop(ip, None)


# ── Admin auth dependency ──────────────────────────────────────────

def require_admin(
    request: Request,
    x_admin_password: str = Header(default="", alias="X-Admin-Password"),
) -> None:
    """Validate admin password from header. Rate-limited per IP."""
    from src.core.config import settings

    if not settings.admin_password:
        raise HTTPException(
            status_code=500,
            detail={"message": "ADMIN_PASSWORD not configured on server."},
        )

    ip = request.client.host if request.client else "unknown"
    _check_admin_rate_limit(ip)

    if x_admin_password != settings.admin_password:
        _record_admin_failure(ip)
        raise HTTPException(
            status_code=401,
            detail={"message": "Invalid admin password."},
        )

    _clear_admin_rate_limit(ip)


# ── Public endpoints ───────────────────────────────────────────────

@router.get("")
async def list_news(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=12, ge=1, le=200),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    news_repo: INewsRepository = Depends(get_news_repo),
) -> ApiResponse[dict]:
    """List published news posts, newest first."""
    result = news_repo.list_published(page=page, size=size, category=category)
    return ApiResponse.ok(result)


@router.get("/{slug}")
async def get_news(
    slug: str,
    news_repo: INewsRepository = Depends(get_news_repo),
) -> ApiResponse[dict]:
    """Get a single published news post by slug."""
    post = news_repo.get_by_slug(slug)
    if post is None:
        raise HTTPException(
            status_code=404,
            detail={"message": f"News post '{slug}' not found"},
        )
    return ApiResponse.ok(post)


# ── Admin endpoints ────────────────────────────────────────────────

@admin_router.get("")
async def admin_list_news(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    include_drafts: bool = Query(default=True),
    news_repo: INewsRepository = Depends(get_news_repo),
    _admin: None = Depends(require_admin),
) -> ApiResponse[dict]:
    """Admin: list all news posts including drafts."""
    result = news_repo.list_all(page=page, size=size, include_drafts=include_drafts)
    return ApiResponse.ok(result)


@admin_router.get("/{slug}")
async def admin_get_news(
    slug: str,
    news_repo: INewsRepository = Depends(get_news_repo),
    _admin: None = Depends(require_admin),
) -> ApiResponse[dict]:
    """Admin: get any news post including drafts."""
    post = news_repo.get_by_slug_admin(slug)
    if post is None:
        raise HTTPException(
            status_code=404,
            detail={"message": f"News post '{slug}' not found"},
        )
    return ApiResponse.ok(post)


@admin_router.post("", status_code=201)
async def admin_create_news(
    body: NewsPostCreate,
    news_repo: INewsRepository = Depends(get_news_repo),
    _admin: None = Depends(require_admin),
) -> ApiResponse[dict]:
    """Admin: create a new news post."""
    # Check slug uniqueness
    existing = news_repo.get_by_slug_admin(body.slug)
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail={"message": f"News post with slug '{body.slug}' already exists"},
        )
    post = news_repo.create(body.model_dump())
    return ApiResponse.ok(post)


@admin_router.put("/{slug}")
async def admin_update_news(
    slug: str,
    body: NewsPostUpdate,
    news_repo: INewsRepository = Depends(get_news_repo),
    _admin: None = Depends(require_admin),
) -> ApiResponse[dict]:
    """Admin: update an existing news post."""
    # Only send non-None fields
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=400,
            detail={"message": "No fields to update"},
        )
    post = news_repo.update(slug, update_data)
    if post is None:
        raise HTTPException(
            status_code=404,
            detail={"message": f"News post '{slug}' not found"},
        )
    return ApiResponse.ok(post)


@admin_router.delete("/{slug}")
async def admin_delete_news(
    slug: str,
    news_repo: INewsRepository = Depends(get_news_repo),
    _admin: None = Depends(require_admin),
) -> ApiResponse[dict]:
    """Admin: delete a news post."""
    deleted = news_repo.delete(slug)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail={"message": f"News post '{slug}' not found"},
        )
    return ApiResponse.ok({"deleted": True, "slug": slug})
