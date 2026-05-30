"""Hardware-related Pydantic schemas."""

from pydantic import Field
from src.schemas.common import BaseSchema


class HardwareInput(BaseSchema):
    """Hardware input from browser detection."""

    gpu_name: str = Field(..., min_length=1, max_length=255, description="GPU name from WebGPU API")
    ram_gb: float = Field(..., ge=0, le=1024, description="System RAM in GB")
    cpu_cores: int = Field(..., ge=1, le=512, description="Logical CPU cores")
    os: str = Field(..., min_length=1, max_length=50, description="Operating system")


class GpuInfo(BaseSchema):
    """Resolved GPU information after mapping."""

    gpu_name: str
    vram_gb: float
    gpu_tier: str  # entry | mid | high | enthusiast
    vendor: str
    benchmark_score: int | None = None
    flops_tflops: float | None = None
    memory_bandwidth_gb_s: float | None = None


class HardwareInfo(BaseSchema):
    """Complete hardware profile after server-side resolution."""

    gpu_name: str
    vram_gb: float
    gpu_tier: str
    ram_gb: float
    cpu_cores: int
    os: str
