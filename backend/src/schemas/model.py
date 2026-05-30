"""Model-related Pydantic schemas."""

from datetime import datetime

from pydantic import Field
from src.schemas.common import BaseSchema


class ModelListItem(BaseSchema):
    """Model summary for list display."""

    id: str
    family: str
    name: str
    parameter_count_b: float
    quantization: str
    quantization_bits: int
    min_vram_gb: float
    recommended_vram_gb: float
    context_length: int
    quality_score: int


class ModelDetail(BaseSchema):
    """Full model detail."""

    id: str
    family: str
    name: str
    parameter_count_b: float
    quantization: str
    quantization_bits: int
    min_vram_gb: float
    recommended_vram_gb: float
    context_length: int
    hidden_dim: int
    num_layers: int
    quality_score: int
    download_url: str
    huggingface_repo: str
    created_at: datetime
    updated_at: datetime
