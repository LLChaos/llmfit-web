"""Common API response wrappers and base schema."""

from typing import Generic, TypeVar

from pydantic import BaseModel
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    """Base schema with camelCase JSON alias generation.

    All API schemas inherit from this to ensure consistent JSON field naming.
    Python: snake_case (PEP8) -> JSON: camelCase (API convention).
    """

    model_config = {
        "alias_generator": to_camel,
        "populate_by_name": True,  # Accept both camelCase and snake_case input
    }


T = TypeVar("T")


class ApiResponse(BaseSchema, Generic[T]):
    """Standard API response wrapper."""

    success: bool
    data: T | None = None
    error: dict[str, str] | None = None

    @classmethod
    def ok(cls, data: T) -> "ApiResponse[T]":
        """Create a success response."""
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, message: str) -> "ApiResponse[T]":
        """Create an error response."""
        return cls(success=False, error={"message": message})


class PaginatedData(BaseSchema, Generic[T]):
    """Paginated data wrapper."""

    items: list[T]
    total: int
    page: int
    size: int
