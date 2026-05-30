"""Custom application exceptions."""


class LLMFitError(Exception):
    """Base exception for LLMFit application."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class GpuNotFoundError(LLMFitError):
    """GPU not found in database."""

    def __init__(self, gpu_name: str) -> None:
        super().__init__(
            message=f"GPU '{gpu_name}' not found in database",
            status_code=404,
        )


class ModelNotFoundError(LLMFitError):
    """Model not found in database."""

    def __init__(self, model_id: str) -> None:
        super().__init__(
            message=f"Model '{model_id}' not found",
            status_code=404,
        )


class InputValidationError(LLMFitError):
    """Input validation error — distinct from pydantic.ValidationError.

    Use this when business-rule validation fails (not Pydantic schema validation).
    """

    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=422)
