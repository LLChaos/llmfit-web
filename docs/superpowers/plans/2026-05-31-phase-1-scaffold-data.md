# Phase 1: 项目脚手架 + 数据层 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建前后端项目骨架、定义所有类型和接口、准备 Mock 数据、建立 Repository 抽象层、前端 i18n 基础设施。Phase 1 结束后，`backend/` 和 `frontend/` 可独立启动，类型系统就绪。

**Architecture:** 后端采用 FastAPI + Pydantic + Protocol-based Repository 模式；前端采用 Next.js 15 + Shadcn UI + Zustand + TanStack Query；数据层用 JSON 文件驱动，通过 Protocol 接口访问，后续可无缝切换 SQL。

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, Next.js 15, TypeScript 5, TailwindCSS, Shadcn UI, Zustand

---

## 文件结构预览

```
backend/
├── pyproject.toml
├── requirements.txt
├── .env
├── .env.example
├── src/
│   ├── __init__.py
│   ├── main.py                          ← FastAPI 入口
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py                    ← 主路由聚合
│   │   ├── recommend.py                 ← POST /api/v1/recommend (占位)
│   │   └── models.py                    ← GET /api/v1/models/* (占位)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                    ← Settings from .env
│   │   └── exceptions.py               ← 自定义异常
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py                    ← ApiResponse[T] 通用包装
│   │   ├── hardware.py                  ← HardwareInput / HardwareInfo
│   │   ├── model.py                     ← ModelDetail / ModelListItem
│   │   └── recommendation.py            ← RecommendationResponse / ModelScore
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── interfaces.py                ← IModelRepository / IGpuRepository Protocol
│   │   ├── json_model_repository.py     ← JSON 实现
│   │   └── json_gpu_repository.py       ← JSON 实现
│   ├── models/                          ← SQLAlchemy ORM (Phase 4+ 才用，先占位)
│   ├── services/                        ← Phase 2 实现
│   ├── utils/
│   │   ├── __init__.py
│   │   └── vram.py                      ← VRAM 估算工具函数
│   └── data/
│       ├── mock_gpu_specs.json          ← 30+ GPU
│       └── mock_models.json             ← 50 模型
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_repositories/
    │   ├── __init__.py
    │   ├── test_json_gpu_repository.py
    │   └── test_json_model_repository.py
    └── test_schemas/
        ├── __init__.py
        ├── test_hardware_schema.py
        └── test_recommendation_schema.py

frontend/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── components.json                    ← Shadcn UI 配置
├── .env.local
├── src/
│   ├── app/
│   │   ├── layout.tsx                 ← RootLayout (Dark Mode + i18n Provider)
│   │   ├── page.tsx                   ← 唯一页面
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        ← Shadcn UI 组件 (button, card, dialog...)
│   │   ├── hero-section.tsx           ← Hero 区域
│   │   ├── hardware-card.tsx          ← 硬件信息卡片 (占位)
│   │   ├── recommendation-list.tsx    ← 推荐列表 (占位)
│   │   ├── model-card.tsx             ← 模型卡片 (占位)
│   │   ├── model-detail-modal.tsx     ← 模型详情弹窗 (占位)
│   │   ├── upgrade-suggestions.tsx    ← 升级建议 (占位)
│   │   └── language-switcher.tsx      ← 中英文切换
│   ├── features/
│   │   └── hardware-detection.ts      ← 浏览器硬件检测
│   ├── hooks/
│   │   ├── use-hardware-detection.ts
│   │   ├── use-recommendations.ts     ← TanStack Query Hook (占位)
│   │   └── use-translation.ts
│   ├── services/
│   │   └── api-client.ts             ← API 请求封装
│   ├── stores/
│   │   ├── hardware-store.ts         ← Zustand: 硬件检测状态
│   │   └── locale-store.ts           ← Zustand: 语言偏好 (zh/en)
│   ├── types/
│   │   ├── hardware.ts
│   │   ├── recommendation.ts
│   │   └── model.ts
│   └── lib/
│       ├── i18n/
│       │   ├── zh.json               ← 中文翻译字典
│       │   └── en.json               ← 英文翻译字典
│       └── utils.ts
```

---

### Task 1: 后端项目初始化

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/requirements.txt`
- Create: `backend/src/__init__.py`

- [ ] **Step 1: 创建 pyproject.toml**

```toml
[project]
name = "llmfit-web-backend"
version = "0.1.0"
description = "LLMFit Web backend - hardware-LLM recommendation platform"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.0",
    "pydantic-settings>=2.0",
    "sqlalchemy>=2.0",
    "alembic>=1.14.0",
    "python-dotenv>=1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "httpx>=0.28.0",
    "ruff>=0.8.0",
]

[build-system]
requires = ["setuptools>=75.0"]
build-backend = "setuptools.build_meta"
```

- [ ] **Step 2: 创建 requirements.txt**

```text
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.0
pydantic-settings>=2.0
sqlalchemy>=2.0
alembic>=1.14.0
python-dotenv>=1.0
pytest>=8.0
pytest-cov>=5.0
httpx>=0.28.0
ruff>=0.8.0
```

- [ ] **Step 3: 创建目录结构**

Run:
```bash
cd backend
mkdir -p src/api src/core src/schemas src/repositories src/models src/services/scoring src/utils src/data
mkdir -p tests/test_repositories tests/test_schemas tests/test_services
touch src/__init__.py src/api/__init__.py src/core/__init__.py src/schemas/__init__.py src/repositories/__init__.py src/models/__init__.py src/services/__init__.py src/services/scoring/__init__.py src/utils/__init__.py
touch tests/__init__.py tests/test_repositories/__init__.py tests/test_schemas/__init__.py tests/test_services/__init__.py
```

- [ ] **Step 4: 安装依赖并验证**

Run:
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
python -c "import fastapi; import pydantic; print('OK')"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "chore: initialize backend project structure"
```

---

### Task 2: 后端核心配置与异常

**Files:**
- Create: `backend/src/core/config.py`
- Create: `backend/src/core/exceptions.py`
- Create: `backend/.env`
- Create: `backend/.env.example`

- [ ] **Step 1: 创建 .env.example 和 .env**

`backend/.env.example`:
```env
APP_NAME=LLMFit Web
APP_VERSION=0.1.0
DEBUG=true
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/llmfit
```

`backend/.env` (复制 .env.example 内容):
```env
APP_NAME=LLMFit Web
APP_VERSION=0.1.0
DEBUG=true
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/llmfit
```

- [ ] **Step 2: 创建 core/config.py**

```python
"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "LLMFit Web"
    app_version: str = "0.1.0"
    debug: bool = True
    cors_origins: str = "http://localhost:3000"
    database_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
```

- [ ] **Step 3: 创建 core/exceptions.py**

```python
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


class ValidationError(LLMFitError):
    """Input validation error."""

    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=422)
```

- [ ] **Step 4: 验证导入**

Run:
```bash
cd backend
source venv/Scripts/activate
python -c "from src.core.config import settings; from src.core.exceptions import GpuNotFoundError; print(settings.app_name); print('OK')"
```
Expected:
```
LLMFit Web
OK
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/core/ backend/.env backend/.env.example
git commit -m "feat: add core config and custom exceptions"
```

---

### Task 3: Pydantic Schemas

**Files:**
- Create: `backend/src/schemas/common.py`
- Create: `backend/src/schemas/hardware.py`
- Create: `backend/src/schemas/model.py`
- Create: `backend/src/schemas/recommendation.py`

> **类型一致性说明**：Pydantic 默认用 snake_case，但 JSON API 约定用 camelCase。通过 `BaseSchema` 基类统一配置 `alias_generator`，所有 Schema 继承它即可自动转换：Python 侧 `gpu_name` ↔ JSON 侧 `gpuName`。

- [ ] **Step 1: 创建 common.py**

```python
"""Common API response wrappers and base schema."""

from typing import Generic, TypeVar

from pydantic import BaseModel
from pydantic.alias_generators import to_camel


class BaseSchema(BaseModel):
    """Base schema with camelCase JSON alias generation.

    All API schemas inherit from this to ensure consistent JSON field naming.
    Python: snake_case (PEP8) → JSON: camelCase (API convention).
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
```

- [ ] **Step 2: 创建 hardware.py**

```python
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
```

- [ ] **Step 3: 创建 model.py**

```python
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
```

- [ ] **Step 4: 创建 recommendation.py**

```python
"""Recommendation-related Pydantic schemas."""

from pydantic import Field
from src.schemas.common import BaseSchema


class ModelScores(BaseSchema):
    """Scoring breakdown for a recommended model."""

    quality: float = Field(..., ge=0, le=100)
    speed: float = Field(..., ge=0, le=100)
    compatibility: float = Field(..., ge=0, le=100)
    context: float = Field(..., ge=0, le=100)
    total: float = Field(..., ge=0, le=100)


class RecommendedModel(BaseSchema):
    """A single recommended model entry."""

    model_id: str
    rank: int
    scores: ModelScores
    estimated_vram_gb: float
    estimated_tokens_per_sec: float
    runnable: bool


class UpgradeSuggestion(BaseSchema):
    """Hardware upgrade suggestion."""

    current_gpu: str
    suggested_gpu: str
    improvement: "UpgradeImprovement"


class UpgradeImprovement(BaseSchema):
    """Improvement details for an upgrade suggestion."""

    vram_delta_gb: float
    speed_boost_pct: float
    unlocks_models: list[str]


class RecommendationResponse(BaseSchema):
    """Complete recommendation response."""

    hardware: "HardwareInfo"  # ForwardRef — resolved at runtime
    recommendations: list[RecommendedModel]
    upgrade_suggestions: list[UpgradeSuggestion]


# Resolve forward references
from src.schemas.hardware import HardwareInfo  # noqa: E402

RecommendationResponse.model_rebuild()
UpgradeSuggestion.model_rebuild()
```

- [ ] **Step 5: 验证所有 schema 可导入**

Run:
```bash
cd backend
source venv/Scripts/activate
python -c "
from src.schemas.common import ApiResponse, PaginatedData
from src.schemas.hardware import HardwareInput, GpuInfo, HardwareInfo
from src.schemas.model import ModelListItem, ModelDetail
from src.schemas.recommendation import ModelScores, RecommendedModel, RecommendationResponse
print('All schemas imported successfully')
"
```
Expected: `All schemas imported successfully`

- [ ] **Step 6: Commit**

```bash
git add backend/src/schemas/
git commit -m "feat: add Pydantic schemas for hardware, model, and recommendation"
```

---

### Task 4: Repository 接口定义

**Files:**
- Create: `backend/src/repositories/interfaces.py`

- [ ] **Step 1: 创建 interfaces.py**

```python
"""Repository interfaces using Python Protocol for structural subtyping."""

from typing import Protocol


class IGpuRepository(Protocol):
    """GPU data access interface.

    Implementations: JsonGpuRepository (Phase 1-3), SqlGpuRepository (Phase 4+)
    """

    def get_all(self) -> list[dict]:
        """Return all GPU specs."""
        ...

    def get_by_name(self, name: str) -> dict | None:
        """Find GPU by exact name match."""
        ...

    def find_closest_match(self, gpu_name: str) -> dict | None:
        """Find the closest matching GPU by fuzzy/substring matching.

        WebGPU API returns GPU names that may not exactly match our database.
        This method handles partial/inexact matching.
        """
        ...

    def get_by_tier(self, tier: str) -> list[dict]:
        """Return all GPUs in a given tier (entry/mid/high/enthusiast)."""
        ...

    def get_next_tier_gpus(self, current_tier: str) -> list[dict]:
        """Return GPUs from the next tier up (for upgrade suggestions)."""
        ...


class IModelRepository(Protocol):
    """Model data access interface.

    Implementations: JsonModelRepository (Phase 1-3), SqlModelRepository (Phase 4+)
    """

    def get_all(
        self,
        page: int = 1,
        size: int = 20,
        family: str | None = None,
    ) -> dict:
        """Return paginated model list. Returns {"items": [...], "total": N, "page": P, "size": S}."""
        ...

    def get_by_id(self, model_id: str) -> dict | None:
        """Find model by ID."""
        ...

    def get_by_family(self, family: str) -> list[dict]:
        """Return all models in a family."""
        ...

    def get_runnable_models(self, max_vram_gb: float) -> list[dict]:
        """Return models whose recommended VRAM <= max_vram_gb."""
        ...
```

- [ ] **Step 2: 验证导入**

Run:
```bash
cd backend && source venv/Scripts/activate
python -c "from src.repositories.interfaces import IGpuRepository, IModelRepository; print('Interfaces OK')"
```
Expected: `Interfaces OK`

- [ ] **Step 3: Commit**

```bash
git add backend/src/repositories/interfaces.py
git commit -m "feat: define Repository interfaces (Protocol)"
```

---

### Task 5: VRAM 工具函数

**Files:**
- Create: `backend/src/utils/__init__.py`
- Create: `backend/src/utils/vram.py`

- [ ] **Step 1: 创建 utils/__init__.py**

```python
"""Utility functions."""
```

- [ ] **Step 2: 创建 utils/vram.py**

```python
"""VRAM estimation utility functions.

Formulas from:
- Jinghong Chen: https://www.jinghong-chen.net/estimate-vram-usage-in-llm-inference/
- deep-research-report.md
"""


def estimate_vram_simple(
    parameter_count_b: float,
    quantization_bits: int = 16,
    overhead: float = 0.2,
) -> float:
    """Quick VRAM estimate for filtering.

    Formula: VRAM_GB = P * (Q_bits / 8) * (1 + overhead)

    Args:
        parameter_count_b: Parameters in billions.
        quantization_bits: Quantization bit width (4, 8, or 16).
        overhead: KV cache + framework overhead factor (default 0.2 = 20%).

    Returns:
        Estimated VRAM in GB.
    """
    return parameter_count_b * (quantization_bits / 8.0) * (1.0 + overhead)


def estimate_vram_precise(
    num_params: int,
    hidden_dim: int,
    num_layers: int,
    batch_size: int = 1,
    sequence_length: int = 4096,
) -> float:
    """Precise VRAM estimate using Jinghong Chen's formula.

    Formula: VRAM = N*2 + 2*h*L*b*s*2

    Args:
        num_params: Total number of parameters.
        hidden_dim: Hidden dimension size.
        num_layers: Number of transformer layers.
        batch_size: Batch size (default 1 for single-user inference).
        sequence_length: Context sequence length.

    Returns:
        Estimated VRAM in bytes.
    """
    model_weights_bytes = num_params * 2  # 16-bit precision
    kv_cache_bytes = 2 * hidden_dim * num_layers * batch_size * sequence_length * 2
    return model_weights_bytes + kv_cache_bytes


def bytes_to_gb(num_bytes: float) -> float:
    """Convert bytes to gigabytes."""
    return num_bytes / (1024**3)


def estimate_tpot(
    num_params: int,
    batch_size: int,
    gpu_flops: float,
    gpu_bandwidth_gb_s: float,
) -> float:
    """Estimate Time Per Output Token (TPOT) in seconds.

    From Jinghong Chen:
        Decode Compute = 2 * N * b * 1
        TPOT = Decode_Compute / GPU_FLOPs + (2 * N) / GPU_BW

    Args:
        num_params: Total number of parameters.
        batch_size: Batch size.
        gpu_flops: GPU FLOPs rate (operations per second).
        gpu_bandwidth_gb_s: GPU memory bandwidth in GB/s.

    Returns:
        Estimated seconds per token.
    """
    decode_compute = 2 * num_params * batch_size * 1
    gpu_bandwidth_bytes_s = gpu_bandwidth_gb_s * 1024**3
    tpot = (decode_compute / gpu_flops) + ((2 * num_params) / gpu_bandwidth_bytes_s)
    return tpot


def estimate_tps(
    num_params: int,
    batch_size: int,
    gpu_flops: float,
    gpu_bandwidth_gb_s: float,
) -> float:
    """Estimate tokens per second (decode phase).

    Args:
        num_params: Total number of parameters.
        batch_size: Batch size.
        gpu_flops: GPU FLOPs rate.
        gpu_bandwidth_gb_s: GPU memory bandwidth in GB/s.

    Returns:
        Estimated tokens per second.
    """
    tpot = estimate_tpot(num_params, batch_size, gpu_flops, gpu_bandwidth_gb_s)
    if tpot <= 0:
        return 0.0
    return 1.0 / tpot
```

- [ ] **Step 3: 验证导入**

Run:
```bash
cd backend && source venv/Scripts/activate
python -c "
from src.utils.vram import estimate_vram_simple, estimate_vram_precise, bytes_to_gb, estimate_tps
result = estimate_vram_simple(7.0, 4)
print(f'7B Q4 VRAM: {result:.1f} GB')
print('Utils OK')
"
```
Expected:
```
7B Q4 VRAM: 4.2 GB
Utils OK
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/utils/
git commit -m "feat: add VRAM estimation and TPS calculation utilities"
```

---

### Task 6: Mock GPU 数据

**Files:**
- Create: `backend/src/data/mock_gpu_specs.json`

- [ ] **Step 1: 创建 mock_gpu_specs.json（30+ GPU）**

```json
[
  {
    "id": "gpu-nvidia-gtx-1650-4gb",
    "name": "NVIDIA GeForce GTX 1650",
    "vendor": "nvidia",
    "vram_gb": 4.0,
    "benchmark_score": 7800,
    "flops_tflops": 2.98,
    "memory_bandwidth_gb_s": 128.0,
    "tier": "entry",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-gtx-1660-ti-6gb",
    "name": "NVIDIA GeForce GTX 1660 Ti",
    "vendor": "nvidia",
    "vram_gb": 6.0,
    "benchmark_score": 12800,
    "flops_tflops": 5.44,
    "memory_bandwidth_gb_s": 288.0,
    "tier": "entry",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-2060-6gb",
    "name": "NVIDIA GeForce RTX 2060",
    "vendor": "nvidia",
    "vram_gb": 6.0,
    "benchmark_score": 14100,
    "flops_tflops": 6.45,
    "memory_bandwidth_gb_s": 336.0,
    "tier": "entry",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-3050-8gb",
    "name": "NVIDIA GeForce RTX 3050",
    "vendor": "nvidia",
    "vram_gb": 8.0,
    "benchmark_score": 12800,
    "flops_tflops": 9.10,
    "memory_bandwidth_gb_s": 224.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-3060-12gb",
    "name": "NVIDIA GeForce RTX 3060",
    "vendor": "nvidia",
    "vram_gb": 12.0,
    "benchmark_score": 17000,
    "flops_tflops": 12.74,
    "memory_bandwidth_gb_s": 360.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-3060-ti-8gb",
    "name": "NVIDIA GeForce RTX 3060 Ti",
    "vendor": "nvidia",
    "vram_gb": 8.0,
    "benchmark_score": 20500,
    "flops_tflops": 16.20,
    "memory_bandwidth_gb_s": 448.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-3070-8gb",
    "name": "NVIDIA GeForce RTX 3070",
    "vendor": "nvidia",
    "vram_gb": 8.0,
    "benchmark_score": 22400,
    "flops_tflops": 20.31,
    "memory_bandwidth_gb_s": 448.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-3070-ti-8gb",
    "name": "NVIDIA GeForce RTX 3070 Ti",
    "vendor": "nvidia",
    "vram_gb": 8.0,
    "benchmark_score": 23700,
    "flops_tflops": 21.75,
    "memory_bandwidth_gb_s": 608.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-4060-8gb",
    "name": "NVIDIA GeForce RTX 4060",
    "vendor": "nvidia",
    "vram_gb": 8.0,
    "benchmark_score": 19600,
    "flops_tflops": 15.11,
    "memory_bandwidth_gb_s": 272.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-4060-ti-16gb",
    "name": "NVIDIA GeForce RTX 4060 Ti",
    "vendor": "nvidia",
    "vram_gb": 16.0,
    "benchmark_score": 22900,
    "flops_tflops": 22.06,
    "memory_bandwidth_gb_s": 288.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-4070-12gb",
    "name": "NVIDIA GeForce RTX 4070",
    "vendor": "nvidia",
    "vram_gb": 12.0,
    "benchmark_score": 26900,
    "flops_tflops": 29.15,
    "memory_bandwidth_gb_s": 504.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-4070-ti-12gb",
    "name": "NVIDIA GeForce RTX 4070 Ti",
    "vendor": "nvidia",
    "vram_gb": 12.0,
    "benchmark_score": 31700,
    "flops_tflops": 40.09,
    "memory_bandwidth_gb_s": 504.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-4080-16gb",
    "name": "NVIDIA GeForce RTX 4080",
    "vendor": "nvidia",
    "vram_gb": 16.0,
    "benchmark_score": 34600,
    "flops_tflops": 48.74,
    "memory_bandwidth_gb_s": 716.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-4090-24gb",
    "name": "NVIDIA GeForce RTX 4090",
    "vendor": "nvidia",
    "vram_gb": 24.0,
    "benchmark_score": 38900,
    "flops_tflops": 82.58,
    "memory_bandwidth_gb_s": 1008.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-5070-12gb",
    "name": "NVIDIA GeForce RTX 5070",
    "vendor": "nvidia",
    "vram_gb": 12.0,
    "benchmark_score": 31000,
    "flops_tflops": 30.00,
    "memory_bandwidth_gb_s": 672.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-5080-16gb",
    "name": "NVIDIA GeForce RTX 5080",
    "vendor": "nvidia",
    "vram_gb": 16.0,
    "benchmark_score": 38000,
    "flops_tflops": 56.00,
    "memory_bandwidth_gb_s": 960.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-5090-32gb",
    "name": "NVIDIA GeForce RTX 5090",
    "vendor": "nvidia",
    "vram_gb": 32.0,
    "benchmark_score": 42000,
    "flops_tflops": 100.00,
    "memory_bandwidth_gb_s": 1792.0,
    "tier": "enthusiast",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-a100-80gb",
    "name": "NVIDIA A100",
    "vendor": "nvidia",
    "vram_gb": 80.0,
    "benchmark_score": 35000,
    "flops_tflops": 312.0,
    "memory_bandwidth_gb_s": 2039.0,
    "tier": "enthusiast",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-a6000-48gb",
    "name": "NVIDIA RTX A6000",
    "vendor": "nvidia",
    "vram_gb": 48.0,
    "benchmark_score": 31000,
    "flops_tflops": 38.71,
    "memory_bandwidth_gb_s": 768.0,
    "tier": "enthusiast",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-3080-10gb",
    "name": "NVIDIA GeForce RTX 3080",
    "vendor": "nvidia",
    "vram_gb": 10.0,
    "benchmark_score": 25300,
    "flops_tflops": 29.77,
    "memory_bandwidth_gb_s": 760.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-amd-rx-7900-xtx-24gb",
    "name": "AMD Radeon RX 7900 XTX",
    "vendor": "amd",
    "vram_gb": 24.0,
    "benchmark_score": 31000,
    "flops_tflops": 61.42,
    "memory_bandwidth_gb_s": 960.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-amd-rx-7800-xt-16gb",
    "name": "AMD Radeon RX 7800 XT",
    "vendor": "amd",
    "vram_gb": 16.0,
    "benchmark_score": 24700,
    "flops_tflops": 37.32,
    "memory_bandwidth_gb_s": 624.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-apple-m4-max-48gb",
    "name": "Apple M4 Max",
    "vendor": "apple",
    "vram_gb": 48.0,
    "benchmark_score": 28000,
    "flops_tflops": 30.0,
    "memory_bandwidth_gb_s": 546.0,
    "tier": "enthusiast",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-apple-m3-max-36gb",
    "name": "Apple M3 Max",
    "vendor": "apple",
    "vram_gb": 36.0,
    "benchmark_score": 24000,
    "flops_tflops": 24.0,
    "memory_bandwidth_gb_s": 400.0,
    "tier": "enthusiast",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-apple-m2-ultra-76gb",
    "name": "Apple M2 Ultra",
    "vendor": "apple",
    "vram_gb": 76.0,
    "benchmark_score": 30000,
    "flops_tflops": 27.0,
    "memory_bandwidth_gb_s": 800.0,
    "tier": "enthusiast",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-intel-arc-a770-16gb",
    "name": "Intel Arc A770",
    "vendor": "intel",
    "vram_gb": 16.0,
    "benchmark_score": 15500,
    "flops_tflops": 19.66,
    "memory_bandwidth_gb_s": 560.0,
    "tier": "mid",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-3090-24gb",
    "name": "NVIDIA GeForce RTX 3090",
    "vendor": "nvidia",
    "vram_gb": 24.0,
    "benchmark_score": 29000,
    "flops_tflops": 35.58,
    "memory_bandwidth_gb_s": 936.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-4070-super-12gb",
    "name": "NVIDIA GeForce RTX 4070 Super",
    "vendor": "nvidia",
    "vram_gb": 12.0,
    "benchmark_score": 29800,
    "flops_tflops": 35.48,
    "memory_bandwidth_gb_s": 504.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gpu-nvidia-rtx-4080-super-16gb",
    "name": "NVIDIA GeForce RTX 4080 Super",
    "vendor": "nvidia",
    "vram_gb": 16.0,
    "benchmark_score": 35900,
    "flops_tflops": 52.22,
    "memory_bandwidth_gb_s": 736.0,
    "tier": "high",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  }
]
```

- [ ] **Step 2: 验证 JSON 文件格式**

Run:
```bash
python -c "import json; data=json.load(open('backend/src/data/mock_gpu_specs.json')); print(f'{len(data)} GPUs loaded'); print('Valid JSON')"
```
Expected:
```
29 GPUs loaded
Valid JSON
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/data/mock_gpu_specs.json
git commit -m "feat: add mock GPU specs (29 GPUs across 4 tiers)"
```

---

### Task 7: Mock 模型数据

**Files:**
- Create: `backend/src/data/mock_models.json`

- [ ] **Step 1: 创建 mock_models.json（50 模型，分 6 个家族）**

由于文件较大，此处展示结构模板和代表性的 ~15 个模型。完整 50 个模型在实施时按此结构填充。

```json
[
  {
    "id": "qwen3-0.6b-q4",
    "family": "Qwen",
    "name": "Qwen3 0.6B Q4_K_M",
    "parameter_count_b": 0.6,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 0.8,
    "recommended_vram_gb": 1.2,
    "context_length": 32768,
    "hidden_dim": 1024,
    "num_layers": 28,
    "quality_score": 42,
    "download_url": "https://huggingface.co/Qwen/Qwen3-0.6B-GGUF",
    "huggingface_repo": "Qwen/Qwen3-0.6B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "qwen3-1.8b-q4",
    "family": "Qwen",
    "name": "Qwen3 1.8B Q4_K_M",
    "parameter_count_b": 1.8,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 1.5,
    "recommended_vram_gb": 2.0,
    "context_length": 32768,
    "hidden_dim": 2048,
    "num_layers": 24,
    "quality_score": 55,
    "download_url": "https://huggingface.co/Qwen/Qwen3-1.8B-GGUF",
    "huggingface_repo": "Qwen/Qwen3-1.8B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "qwen3-4b-q4",
    "family": "Qwen",
    "name": "Qwen3 4B Q4_K_M",
    "parameter_count_b": 4.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 2.8,
    "recommended_vram_gb": 3.5,
    "context_length": 32768,
    "hidden_dim": 2560,
    "num_layers": 36,
    "quality_score": 68,
    "download_url": "https://huggingface.co/Qwen/Qwen3-4B-GGUF",
    "huggingface_repo": "Qwen/Qwen3-4B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "qwen3-8b-q4",
    "family": "Qwen",
    "name": "Qwen3 8B Q4_K_M",
    "parameter_count_b": 8.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 4.8,
    "recommended_vram_gb": 6.0,
    "context_length": 32768,
    "hidden_dim": 4096,
    "num_layers": 32,
    "quality_score": 78,
    "download_url": "https://huggingface.co/Qwen/Qwen3-8B-GGUF",
    "huggingface_repo": "Qwen/Qwen3-8B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "qwen3-14b-q4",
    "family": "Qwen",
    "name": "Qwen3 14B Q4_K_M",
    "parameter_count_b": 14.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 8.0,
    "recommended_vram_gb": 10.0,
    "context_length": 32768,
    "hidden_dim": 5120,
    "num_layers": 40,
    "quality_score": 84,
    "download_url": "https://huggingface.co/Qwen/Qwen3-14B-GGUF",
    "huggingface_repo": "Qwen/Qwen3-14B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "qwen3-32b-q4",
    "family": "Qwen",
    "name": "Qwen3 32B Q4_K_M",
    "parameter_count_b": 32.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 18.0,
    "recommended_vram_gb": 22.0,
    "context_length": 32768,
    "hidden_dim": 8192,
    "num_layers": 64,
    "quality_score": 90,
    "download_url": "https://huggingface.co/Qwen/Qwen3-32B-GGUF",
    "huggingface_repo": "Qwen/Qwen3-32B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "qwen3-8b-q8",
    "family": "Qwen",
    "name": "Qwen3 8B Q8_0",
    "parameter_count_b": 8.0,
    "quantization": "Q8_0",
    "quantization_bits": 8,
    "min_vram_gb": 8.0,
    "recommended_vram_gb": 10.0,
    "context_length": 32768,
    "hidden_dim": 4096,
    "num_layers": 32,
    "quality_score": 80,
    "download_url": "https://huggingface.co/Qwen/Qwen3-8B-GGUF",
    "huggingface_repo": "Qwen/Qwen3-8B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "llama3.1-8b-q4",
    "family": "Llama",
    "name": "Llama 3.1 8B Q4_K_M",
    "parameter_count_b": 8.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 4.8,
    "recommended_vram_gb": 6.0,
    "context_length": 131072,
    "hidden_dim": 4096,
    "num_layers": 32,
    "quality_score": 80,
    "download_url": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct-GGUF",
    "huggingface_repo": "meta-llama/Llama-3.1-8B-Instruct-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "llama3.1-70b-q4",
    "family": "Llama",
    "name": "Llama 3.1 70B Q4_K_M",
    "parameter_count_b": 70.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 38.0,
    "recommended_vram_gb": 44.0,
    "context_length": 131072,
    "hidden_dim": 8192,
    "num_layers": 80,
    "quality_score": 92,
    "download_url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct-GGUF",
    "huggingface_repo": "meta-llama/Llama-3.1-70B-Instruct-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gemma3-4b-q4",
    "family": "Gemma",
    "name": "Gemma 3 4B Q4_K_M",
    "parameter_count_b": 4.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 2.8,
    "recommended_vram_gb": 3.5,
    "context_length": 32768,
    "hidden_dim": 2560,
    "num_layers": 28,
    "quality_score": 66,
    "download_url": "https://huggingface.co/google/gemma-3-4b-it-GGUF",
    "huggingface_repo": "google/gemma-3-4b-it-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "gemma3-12b-q4",
    "family": "Gemma",
    "name": "Gemma 3 12B Q4_K_M",
    "parameter_count_b": 12.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 7.2,
    "recommended_vram_gb": 9.0,
    "context_length": 32768,
    "hidden_dim": 5120,
    "num_layers": 40,
    "quality_score": 82,
    "download_url": "https://huggingface.co/google/gemma-3-12b-it-GGUF",
    "huggingface_repo": "google/gemma-3-12b-it-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "mistral-7b-q4",
    "family": "Mistral",
    "name": "Mistral 7B Q4_K_M",
    "parameter_count_b": 7.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 4.2,
    "recommended_vram_gb": 5.5,
    "context_length": 8192,
    "hidden_dim": 4096,
    "num_layers": 32,
    "quality_score": 76,
    "download_url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3-GGUF",
    "huggingface_repo": "mistralai/Mistral-7B-Instruct-v0.3-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "deepseek-r1-distill-7b-q4",
    "family": "DeepSeek",
    "name": "DeepSeek R1 Distill Qwen 7B Q4_K_M",
    "parameter_count_b": 7.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 4.2,
    "recommended_vram_gb": 5.5,
    "context_length": 131072,
    "hidden_dim": 4096,
    "num_layers": 32,
    "quality_score": 79,
    "download_url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B-GGUF",
    "huggingface_repo": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "deepseek-r1-distill-14b-q4",
    "family": "DeepSeek",
    "name": "DeepSeek R1 Distill Qwen 14B Q4_K_M",
    "parameter_count_b": 14.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 8.0,
    "recommended_vram_gb": 10.0,
    "context_length": 131072,
    "hidden_dim": 5120,
    "num_layers": 40,
    "quality_score": 85,
    "download_url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B-GGUF",
    "huggingface_repo": "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  },
  {
    "id": "phi-4-14b-q4",
    "family": "Phi",
    "name": "Phi-4 14B Q4_K_M",
    "parameter_count_b": 14.0,
    "quantization": "Q4_K_M",
    "quantization_bits": 4,
    "min_vram_gb": 8.0,
    "recommended_vram_gb": 10.0,
    "context_length": 16384,
    "hidden_dim": 5120,
    "num_layers": 40,
    "quality_score": 83,
    "download_url": "https://huggingface.co/microsoft/phi-4-GGUF",
    "huggingface_repo": "microsoft/phi-4-GGUF",
    "created_at": "2026-05-31T00:00:00Z",
    "updated_at": "2026-05-31T00:00:00Z"
  }
]
```

> **注意**：完整 50 个模型在实施时按此结构补充。覆盖家族：Qwen3(12), Llama 3.1(8), Gemma 3(8), Mistral(6), DeepSeek(10), Others(6)。

- [ ] **Step 2: 验证 JSON 格式**

Run:
```bash
python -c "import json; data=json.load(open('backend/src/data/mock_models.json')); print(f'{len(data)} models loaded'); families = set(m['family'] for m in data); print(f'Families: {families}'); print('Valid JSON')"
```
Expected: (实际数量取决于完整数据)
```
50 models loaded
Families: {'Qwen', 'Llama', 'Gemma', 'Mistral', 'DeepSeek', 'Phi', ...}
Valid JSON
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/data/mock_models.json
git commit -m "feat: add mock model specs (50 models across 6 families)"
```

---

### Task 8: JSON Repository 实现

**Files:**
- Create: `backend/src/repositories/json_gpu_repository.py`
- Create: `backend/src/repositories/json_model_repository.py`

- [ ] **Step 1: 创建 json_gpu_repository.py**

```python
"""JSON file implementation of IGpuRepository."""

import json
from pathlib import Path


class JsonGpuRepository:
    """GPU repository backed by a JSON file."""

    # Tier hierarchy for upgrade suggestions
    _TIER_ORDER = {"entry": 0, "mid": 1, "high": 2, "enthusiast": 3}

    def __init__(self, file_path: str | Path) -> None:
        """Load GPU specs from JSON file.

        Args:
            file_path: Path to mock_gpu_specs.json.
        """
        self._file_path = Path(file_path)
        self._gpus: list[dict] = []
        self._load()

    def _load(self) -> None:
        """Load and parse the JSON data file."""
        with open(self._file_path, encoding="utf-8") as f:
            self._gpus = json.load(f)

    def get_all(self) -> list[dict]:
        """Return all GPU specs."""
        return list(self._gpus)

    def get_by_name(self, name: str) -> dict | None:
        """Find GPU by exact name match (case-insensitive)."""
        name_lower = name.lower().strip()
        for gpu in self._gpus:
            if gpu["name"].lower() == name_lower:
                return dict(gpu)
        return None

    def find_closest_match(self, gpu_name: str) -> dict | None:
        """Find closest GPU by substring matching.

        Strategy (in priority order):
        1. Exact name match (case-insensitive)
        2. Substring match (gpu_name contains db name or vice versa)
        3. Match by vendor + VRAM
        4. Return None if no match found
        """
        if not gpu_name:
            return None

        name_lower = gpu_name.lower().strip()

        # Step 1: Exact match
        exact = self.get_by_name(name_lower)
        if exact:
            return exact

        # Step 2: Substring match
        best_match = None
        best_score = 0
        for gpu in self._gpus:
            db_name_lower = gpu["name"].lower()
            score = 0
            if name_lower in db_name_lower:
                score = len(name_lower) / len(db_name_lower)
            elif db_name_lower in name_lower:
                score = len(db_name_lower) / len(name_lower)
            if score > best_score:
                best_score = score
                best_match = gpu

        if best_match:
            return dict(best_match)

        return None

    def get_by_tier(self, tier: str) -> list[dict]:
        """Return all GPUs in a given tier."""
        return [dict(g) for g in self._gpus if g["tier"] == tier]

    def get_next_tier_gpus(self, current_tier: str) -> list[dict]:
        """Return GPUs from tiers above the current tier."""
        current_level = self._TIER_ORDER.get(current_tier, -1)
        if current_level < 0:
            return []
        return [
            dict(g)
            for g in self._gpus
            if self._TIER_ORDER.get(g["tier"], -1) > current_level
        ]
```

- [ ] **Step 2: 创建 json_model_repository.py**

```python
"""JSON file implementation of IModelRepository."""

import json
from pathlib import Path


class JsonModelRepository:
    """Model repository backed by a JSON file."""

    def __init__(self, file_path: str | Path) -> None:
        """Load model specs from JSON file.

        Args:
            file_path: Path to mock_models.json.
        """
        self._file_path = Path(file_path)
        self._models: list[dict] = []
        self._load()

    def _load(self) -> None:
        """Load and parse the JSON data file."""
        with open(self._file_path, encoding="utf-8") as f:
            self._models = json.load(f)

    def get_all(
        self,
        page: int = 1,
        size: int = 20,
        family: str | None = None,
    ) -> dict:
        """Return paginated model list.

        Args:
            page: Page number (1-indexed).
            size: Items per page.
            family: Optional family filter.

        Returns:
            {"items": [...], "total": N, "page": P, "size": S}
        """
        filtered = self._models
        if family:
            filtered = [
                m for m in self._models
                if m["family"].lower() == family.lower()
            ]

        total = len(filtered)
        start = (page - 1) * size
        end = start + size
        items = filtered[start:end]

        return {
            "items": [dict(m) for m in items],
            "total": total,
            "page": page,
            "size": size,
        }

    def get_by_id(self, model_id: str) -> dict | None:
        """Find model by exact ID."""
        for model in self._models:
            if model["id"] == model_id:
                return dict(model)
        return None

    def get_by_family(self, family: str) -> list[dict]:
        """Return all models in a family."""
        return [
            dict(m) for m in self._models
            if m["family"].lower() == family.lower()
        ]

    def get_runnable_models(self, max_vram_gb: float) -> list[dict]:
        """Return models whose recommended VRAM <= max_vram_gb."""
        return [
            dict(m) for m in self._models
            if m["recommended_vram_gb"] <= max_vram_gb
        ]
```

- [ ] **Step 3: 创建 repositories/__init__.py**

```python
"""Repository layer — data access abstraction."""
```

- [ ] **Step 4: 验证 Repository 功能**

Run:
```bash
cd backend && source venv/Scripts/activate
python -c "
from src.repositories.json_gpu_repository import JsonGpuRepository
from src.repositories.json_model_repository import JsonModelRepository

gpu_repo = JsonGpuRepository('src/data/mock_gpu_specs.json')
print(f'GPUs total: {len(gpu_repo.get_all())}')
rtx3060 = gpu_repo.find_closest_match('NVIDIA GeForce RTX 3060')
print(f'RTX 3060: VRAM={rtx3060[\"vram_gb\"]}GB, tier={rtx3060[\"tier\"]}')

model_repo = JsonModelRepository('src/data/mock_models.json')
print(f'Models total: {model_repo.get_all(size=100)[\"total\"]}')
qwen_family = model_repo.get_by_family('Qwen')
print(f'Qwen models: {len(qwen_family)}')
runnable = model_repo.get_runnable_models(6.0)
print(f'Runnable with 6GB VRAM: {len(runnable)}')
print('OK')
"
```
Expected: (示例输出)
```
GPUs total: 29
RTX 3060: VRAM=12.0GB, tier=mid
Models total: 50
Qwen models: 12
Runnable with 6GB VRAM: XX
OK
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/repositories/
git commit -m "feat: implement JSON repository classes for GPU and Model data"
```

---

### Task 9: FastAPI 最小应用入口

**Files:**
- Create: `backend/src/main.py`
- Create: `backend/src/api/__init__.py`
- Create: `backend/src/api/router.py`
- Create: `backend/src/api/recommend.py` (占位)
- Create: `backend/src/api/models.py` (占位)

- [ ] **Step 1: 创建 api/router.py**

```python
"""Main API router — aggregates all sub-routers."""

from fastapi import APIRouter

from src.api.recommend import router as recommend_router
from src.api.models import router as models_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(recommend_router)
api_router.include_router(models_router)
```

- [ ] **Step 2: 创建 api/recommend.py (占位)**

```python
"""Recommendation endpoint — Phase 3 implementation."""

from fastapi import APIRouter

from src.schemas.common import ApiResponse

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.post("")
async def recommend() -> ApiResponse[dict]:
    """Submit hardware profile and get model recommendations.

    Phase 3 will implement full recommendation logic.
    """
    return ApiResponse.ok({"message": "Recommendation engine — coming in Phase 3"})
```

- [ ] **Step 3: 创建 api/models.py (占位)**

```python
"""Model listing endpoints — Phase 3 implementation."""

from fastapi import APIRouter

from src.schemas.common import ApiResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.get("")
async def list_models() -> ApiResponse[dict]:
    """List all models with pagination.

    Phase 3 will implement full listing with filters.
    """
    return ApiResponse.ok({"message": "Model list — coming in Phase 3"})


@router.get("/{model_id}")
async def get_model(model_id: str) -> ApiResponse[dict]:
    """Get model detail by ID.

    Phase 3 will implement full detail lookup.
    """
    return ApiResponse.ok({"message": f"Model detail for {model_id} — coming in Phase 3"})
```

- [ ] **Step 4: 创建 main.py**

```python
"""LLMFit Web — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.router import api_router
from src.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    # Startup
    yield
    # Shutdown


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    # CORS
    origins = settings.cors_origins.split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    app.include_router(api_router)

    # Health check
    @app.get("/health")
    async def health_check() -> dict:
        return {"status": "ok", "version": settings.app_version}

    return app


app = create_app()
```

- [ ] **Step 5: 验证后端启动**

Run:
```bash
cd backend && source venv/Scripts/activate
uvicorn src.main:app --host 127.0.0.1 --port 8000 &
sleep 2
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/recommend -X POST
kill %1
```
Expected:
```json
{"status":"ok","version":"0.1.0"}
{"success":true,"data":{"message":"Recommendation engine — coming in Phase 3"}}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main.py backend/src/api/
git commit -m "feat: add FastAPI application entry point with placeholder routes"
```

---

### Task 10: 前端项目初始化

**Files:**
- Create: Next.js 15 项目 (通过 create-next-app)

- [ ] **Step 1: 创建 Next.js 项目**

Run:
```bash
cd frontend
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack \
  --use-npm
```

- [ ] **Step 2: 安装额外依赖**

Run:
```bash
cd frontend
npm install @tanstack/react-query zustand
npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
npx shadcn@latest init -d  # 使用默认配置
npx shadcn@latest add button card dialog
```
Expected: 依赖安装成功，Shadcn UI 组件生成到 `src/components/ui/`

- [ ] **Step 3: 验证前端启动**

Run:
```bash
cd frontend
npm run dev &
sleep 5
curl http://localhost:3000 | head -20
kill %1
```
Expected: 返回 HTML 页面（Next.js 默认首页）

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "chore: initialize Next.js 15 project with Shadcn UI and dependencies"
```

---

### Task 11: 前端类型定义

**Files:**
- Create: `frontend/src/types/hardware.ts`
- Create: `frontend/src/types/model.ts`
- Create: `frontend/src/types/recommendation.ts`

- [ ] **Step 1: 创建 types/hardware.ts**

```typescript
/** Hardware input collected from browser APIs. */
export interface HardwareInput {
  gpuName: string;
  ramGb: number;
  cpuCores: number;
  os: string;
}

/** Resolved GPU info from backend. */
export interface GpuInfo {
  gpuName: string;
  vramGb: number;
  gpuTier: "entry" | "mid" | "high" | "enthusiast";
  vendor: string;
  benchmarkScore?: number;
  flopsTflops?: number;
  memoryBandwidthGbS?: number;
}

/** Full hardware profile after server-side resolution. */
export interface HardwareInfo {
  gpuName: string;
  vramGb: number;
  gpuTier: string;
  ramGb: number;
  cpuCores: number;
  os: string;
}
```

- [ ] **Step 2: 创建 types/model.ts**

```typescript
/** Model summary for list display. */
export interface ModelListItem {
  id: string;
  family: string;
  name: string;
  parameterCountB: number;
  quantization: string;
  quantizationBits: number;
  minVramGb: number;
  recommendedVramGb: number;
  contextLength: number;
  qualityScore: number;
}

/** Complete model detail. */
export interface ModelDetail {
  id: string;
  family: string;
  name: string;
  parameterCountB: number;
  quantization: string;
  quantizationBits: number;
  minVramGb: number;
  recommendedVramGb: number;
  contextLength: number;
  hiddenDim: number;
  numLayers: number;
  qualityScore: number;
  downloadUrl: string;
  huggingfaceRepo: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: 创建 types/recommendation.ts**

```typescript
/** Scoring breakdown for a recommended model. */
export interface ModelScores {
  quality: number;
  speed: number;
  compatibility: number;
  context: number;
  total: number;
}

/** A single recommended model entry. */
export interface RecommendedModel {
  modelId: string;
  rank: number;
  scores: ModelScores;
  estimatedVramGb: number;
  estimatedTokensPerSec: number;
  runnable: boolean;
}

/** Improvement details for upgrade suggestion. */
export interface UpgradeImprovement {
  vramDeltaGb: number;
  speedBoostPct: number;
  unlocksModels: string[];
}

/** Hardware upgrade suggestion. */
export interface UpgradeSuggestion {
  currentGpu: string;
  suggestedGpu: string;
  improvement: UpgradeImprovement;
}

/** Complete recommendation response from backend. */
export interface RecommendationResponse {
  hardware: HardwareInfo;
  recommendations: RecommendedModel[];
  upgradeSuggestions: UpgradeSuggestion[];
}
```

- [ ] **Step 4: 验证 TypeScript 编译**

Run:
```bash
cd frontend
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/
git commit -m "feat: add TypeScript type definitions matching backend schemas"
```

---

### Task 12: 前端 i18n 基础设施

**Files:**
- Create: `frontend/src/lib/i18n/zh.json`
- Create: `frontend/src/lib/i18n/en.json`
- Create: `frontend/src/stores/locale-store.ts`
- Create: `frontend/src/hooks/use-translation.ts`

- [ ] **Step 1: 创建 zh.json**

```json
{
  "hero.title": "Can I Run This LLM?",
  "hero.subtitle": "自动分析你的电脑配置，推荐最适合本地运行的大语言模型",
  "hero.button": "检测我的电脑",
  "hero.detecting": "正在检测硬件...",
  "hero.error": "硬件检测失败，请手动输入配置",

  "hardware.gpu": "显卡",
  "hardware.vram": "显存",
  "hardware.ram": "内存",
  "hardware.cpu": "CPU 线程",
  "hardware.os": "操作系统",
  "hardware.tier": "性能等级",

  "recommendation.title": "推荐模型",
  "recommendation.empty": "未找到合适的模型",
  "recommendation.runnable": "可流畅运行",
  "recommendation.not_runnable": "显存不足",
  "recommendation.sort_by": "排序",
  "recommendation.sort_total": "综合评分",
  "recommendation.sort_quality": "质量评分",
  "recommendation.sort_speed": "速度评分",

  "score.quality": "质量",
  "score.speed": "速度",
  "score.compatibility": "适配度",
  "score.context": "上下文",
  "score.total": "综合",

  "model.parameters": "参数量",
  "model.vram_required": "显存需求",
  "model.context_length": "上下文长度",
  "model.estimated_speed": "预估速度",
  "model.download": "下载模型",
  "model.view_on_hf": "在 HuggingFace 查看",
  "model.detail_title": "模型详情",

  "upgrade.title": "升级建议",
  "upgrade.current": "当前",
  "upgrade.suggested": "建议升级到",
  "upgrade.vram_gain": "显存增加",
  "upgrade.speed_boost": "速度提升",
  "upgrade.unlocks": "解锁模型",

  "common.loading": "加载中...",
  "common.error": "出错了，请稍后重试",
  "common.retry": "重试",
  "common.close": "关闭",

  "footer.text": "LLMFit Web — 本地 LLM 硬件适配推荐平台"
}
```

- [ ] **Step 2: 创建 en.json**

```json
{
  "hero.title": "Can I Run This LLM?",
  "hero.subtitle": "Automatically analyze your PC and find the best local LLMs to run",
  "hero.button": "Analyze My PC",
  "hero.detecting": "Detecting hardware...",
  "hero.error": "Hardware detection failed, please enter specs manually",

  "hardware.gpu": "GPU",
  "hardware.vram": "VRAM",
  "hardware.ram": "RAM",
  "hardware.cpu": "CPU Threads",
  "hardware.os": "Operating System",
  "hardware.tier": "Performance Tier",

  "recommendation.title": "Recommended Models",
  "recommendation.empty": "No compatible models found",
  "recommendation.runnable": "Runs Smoothly",
  "recommendation.not_runnable": "Insufficient VRAM",
  "recommendation.sort_by": "Sort by",
  "recommendation.sort_total": "Overall Score",
  "recommendation.sort_quality": "Quality",
  "recommendation.sort_speed": "Speed",

  "score.quality": "Quality",
  "score.speed": "Speed",
  "score.compatibility": "Compatibility",
  "score.context": "Context",
  "score.total": "Overall",

  "model.parameters": "Parameters",
  "model.vram_required": "VRAM Required",
  "model.context_length": "Context Length",
  "model.estimated_speed": "Est. Speed",
  "model.download": "Download Model",
  "model.view_on_hf": "View on HuggingFace",
  "model.detail_title": "Model Details",

  "upgrade.title": "Upgrade Suggestions",
  "upgrade.current": "Current",
  "upgrade.suggested": "Consider Upgrading To",
  "upgrade.vram_gain": "VRAM Gain",
  "upgrade.speed_boost": "Speed Boost",
  "upgrade.unlocks": "Unlocks Models",

  "common.loading": "Loading...",
  "common.error": "Something went wrong, please try again",
  "common.retry": "Retry",
  "common.close": "Close",

  "footer.text": "LLMFit Web — Local LLM Hardware Compatibility Platform"
}
```

- [ ] **Step 3: 创建 stores/locale-store.ts**

```typescript
"use client";

import { create } from "zustand";

type Locale = "zh" | "en";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "zh",
  setLocale: (locale: Locale) => set({ locale }),
}));
```

- [ ] **Step 4: 创建 hooks/use-translation.ts**

```typescript
"use client";

import { useCallback } from "react";
import { useLocaleStore } from "@/stores/locale-store";
import zh from "@/lib/i18n/zh.json";
import en from "@/lib/i18n/en.json";

const dictionaries: Record<string, Record<string, string>> = { zh, en };

type TranslationKey = keyof typeof zh;

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = dictionaries[locale] ?? dictionaries.zh;
      return dict[key] ?? key;
    },
    [locale]
  );

  return { t, locale };
}
```

- [ ] **Step 5: 验证 i18n 可导入**

Run:
```bash
cd frontend
npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/i18n/ frontend/src/stores/locale-store.ts frontend/src/hooks/use-translation.ts
git commit -m "feat: add i18n infrastructure (zh/en dictionaries, locale store, useTranslation hook)"
```

---

### Task 13: 前端硬件检测 + Zustand Store + API Client

**Files:**
- Create: `frontend/src/features/hardware-detection.ts`
- Create: `frontend/src/stores/hardware-store.ts`
- Create: `frontend/src/hooks/use-hardware-detection.ts`
- Create: `frontend/src/services/api-client.ts`

- [ ] **Step 1: 创建 features/hardware-detection.ts**

```typescript
import type { HardwareInput } from "@/types/hardware";

/**
 * Detect hardware from browser APIs.
 *
 * Uses:
 * - navigator.gpu (WebGPU) for GPU name
 * - navigator.deviceMemory for RAM (Chrome-only, returns GB)
 * - navigator.hardwareConcurrency for CPU threads
 * - navigator.userAgent for OS detection
 *
 * Falls back gracefully when APIs are unavailable.
 */
export async function detectHardware(): Promise<HardwareInput> {
  const gpuName = await detectGpu();
  const ramGb = detectRam();
  const cpuCores = navigator.hardwareConcurrency || 1;
  const os = detectOs();

  return { gpuName, ramGb, cpuCores, os };
}

async function detectGpu(): Promise<string> {
  // Try WebGPU API first
  if ("gpu" in navigator) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const info = await adapter.requestAdapterInfo();
        // info.description looks like "NVIDIA GeForce RTX 3060"
        if (info.description) {
          return info.description;
        }
        // Fallback to vendor + architecture
        const vendor = info.vendor || "";
        const arch = info.architecture || "";
        if (vendor || arch) {
          return `${vendor} ${arch}`.trim();
        }
      }
    } catch {
      // WebGPU not available or permission denied
    }
  }

  // Fallback: try WebGL renderer string
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer) {
          return renderer;
        }
      }
    }
  } catch {
    // WebGL not available
  }

  return "Unknown GPU";
}

function detectRam(): number {
  // navigator.deviceMemory returns GB (Chrome/Edge only)
  const deviceMemory = (navigator as any).deviceMemory;
  if (typeof deviceMemory === "number" && deviceMemory > 0) {
    return deviceMemory;
  }
  // Fallback: assume 8GB (most common)
  return 8;
}

function detectOs(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    return "iOS";
  return "Unknown";
}
```

- [ ] **Step 2: 创建 stores/hardware-store.ts**

```typescript
"use client";

import { create } from "zustand";
import type { HardwareInput, HardwareInfo } from "@/types/hardware";

type DetectionStatus = "idle" | "detecting" | "detected" | "error";

interface HardwareState {
  /** Current detection phase */
  status: DetectionStatus;
  /** Raw browser-detected hardware */
  input: HardwareInput | null;
  /** Server-resolved hardware info (after recommendation API call) */
  resolved: HardwareInfo | null;
  /** Error message if detection failed */
  error: string | null;

  /** Actions */
  setStatus: (status: DetectionStatus) => void;
  setInput: (input: HardwareInput) => void;
  setResolved: (resolved: HardwareInfo) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as DetectionStatus,
  input: null,
  resolved: null,
  error: null,
};

export const useHardwareStore = create<HardwareState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setInput: (input) => set({ input, status: "detected" }),
  setResolved: (resolved) => set({ resolved }),
  setError: (error) => set({ error, status: "error" }),
  reset: () => set(initialState),
}));
```

- [ ] **Step 3: 创建 hooks/use-hardware-detection.ts**

```typescript
"use client";

import { useCallback } from "react";
import { useHardwareStore } from "@/stores/hardware-store";
import { detectHardware } from "@/features/hardware-detection";

export function useHardwareDetection() {
  const store = useHardwareStore();

  const analyze = useCallback(async () => {
    store.setStatus("detecting");
    try {
      const input = await detectHardware();
      store.setInput(input);
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : "Hardware detection failed"
      );
    }
  }, [store]);

  return {
    status: store.status,
    input: store.input,
    error: store.error,
    analyze,
    reset: store.reset,
  };
}
```

- [ ] **Step 4: 创建 services/api-client.ts**

```typescript
import type { HardwareInput } from "@/types/hardware";
import type { RecommendationResponse } from "@/types/recommendation";
import type { ModelListItem, ModelDetail } from "@/types/model";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: { message: string };
}

type ApiResult<T> = ApiSuccess<T> | ApiError;

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json: ApiResult<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message || `API error: ${res.status}`);
  }

  return json.data;
}

export const apiClient = {
  /** Submit hardware profile and get recommendations. */
  recommend: (hardware: HardwareInput) =>
    request<RecommendationResponse>("/recommend", {
      method: "POST",
      body: JSON.stringify({ hardware }),
    }),

  /** Get paginated model list. */
  listModels: (page = 1, size = 20, family?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (family) params.set("family", family);
    return request<{ items: ModelListItem[]; total: number; page: number; size: number }>(
      `/models?${params}`
    );
  },

  /** Get model detail by ID. */
  getModel: (id: string) => request<ModelDetail>(`/models/${id}`),
};
```

- [ ] **Step 5: 验证编译**

Run:
```bash
cd frontend
npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/ frontend/src/stores/hardware-store.ts frontend/src/hooks/use-hardware-detection.ts frontend/src/services/api-client.ts
git commit -m "feat: add hardware detection, hardware store, and API client"
```

---

### Task 14: 前端页面布局（Hero + 占位组件）

**Files:**
- Create/modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/globals.css`
- Create: `frontend/src/components/hero-section.tsx`
- Create: `frontend/src/components/language-switcher.tsx`

- [ ] **Step 1: 修改 globals.css（Dark Mode 基础）**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 2: 修改 app/layout.tsx**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LLMFit Web — Can I Run This LLM?",
  description: "自动分析你的电脑配置，推荐最适合运行的本地大语言模型",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 创建 components/language-switcher.tsx**

```typescript
"use client";

import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      aria-label="Switch language"
    >
      {locale === "zh" ? "EN" : "中文"}
    </Button>
  );
}
```

- [ ] **Step 4: 创建 components/hero-section.tsx**

```typescript
"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useHardwareDetection } from "@/hooks/use-hardware-detection";
import { useHardwareStore } from "@/stores/hardware-store";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

export function HeroSection() {
  const { t } = useTranslation();
  const { analyze } = useHardwareDetection();
  const status = useHardwareStore((s) => s.status);

  const isDetecting = status === "detecting";

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Language switcher — top right */}
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      {/* Hero content */}
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        {t("hero.title")}
      </h1>

      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        {t("hero.subtitle")}
      </p>

      <Button
        size="lg"
        className="mt-10 h-14 px-10 text-lg"
        onClick={analyze}
        disabled={isDetecting}
      >
        {isDetecting ? t("hero.detecting") : t("hero.button")}
      </Button>
    </section>
  );
}
```

- [ ] **Step 5: 修改 app/page.tsx**

```typescript
import { HeroSection } from "@/components/hero-section";

export default function Home() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
```

- [ ] **Step 6: 验证前端运行**

Run:
```bash
cd frontend
npm run build
```
Expected: 构建成功，无错误

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/ frontend/src/components/hero-section.tsx frontend/src/components/language-switcher.tsx
git commit -m "feat: add page layout with Hero section, dark mode, and language switcher"
```

---

### Task 15: 后端 Schema 单元测试

**Files:**
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_schemas/test_hardware_schema.py`
- Create: `backend/tests/test_schemas/test_recommendation_schema.py`

- [ ] **Step 1: 创建 conftest.py**

```python
"""Pytest fixtures."""

import pytest
from pathlib import Path


@pytest.fixture
def data_dir() -> Path:
    """Path to mock data directory."""
    return Path(__file__).parent.parent / "src" / "data"
```

- [ ] **Step 2: 创建 test_hardware_schema.py**

```python
"""Tests for hardware schemas."""

import pytest
from pydantic import ValidationError
from src.schemas.hardware import HardwareInput, GpuInfo, HardwareInfo


class TestHardwareInput:
    def test_valid_input(self) -> None:
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 3060",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        assert hw.gpu_name == "NVIDIA GeForce RTX 3060"
        assert hw.ram_gb == 32.0
        assert hw.cpu_cores == 16
        assert hw.os == "Windows"

    def test_empty_gpu_name_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            HardwareInput(gpu_name="", ram_gb=16, cpu_cores=8, os="Windows")

    def test_negative_ram_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            HardwareInput(
                gpu_name="RTX 3060", ram_gb=-1, cpu_cores=8, os="Windows"
            )

    def test_zero_cpu_cores_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            HardwareInput(
                gpu_name="RTX 3060", ram_gb=16, cpu_cores=0, os="Windows"
            )


class TestHardwareInfo:
    def test_valid_info(self) -> None:
        info = HardwareInfo(
            gpu_name="RTX 3060",
            vram_gb=12.0,
            gpu_tier="mid",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        assert info.gpu_tier == "mid"
        assert info.vram_gb == 12.0
```

- [ ] **Step 3: 创建 test_recommendation_schema.py**

```python
"""Tests for recommendation schemas."""

from src.schemas.hardware import HardwareInfo
from src.schemas.recommendation import (
    ModelScores,
    RecommendedModel,
    RecommendationResponse,
    UpgradeSuggestion,
    UpgradeImprovement,
)


class TestModelScores:
    def test_valid_scores(self) -> None:
        scores = ModelScores(
            quality=85.0, speed=72.0, compatibility=88.0, context=60.0, total=78.5
        )
        assert scores.total == 78.5

    def test_score_range_clamped(self) -> None:
        """Pydantic Field(ge=0, le=100) enforces range validation."""
        from pydantic import ValidationError
        import pytest

        with pytest.raises(ValidationError):
            ModelScores(quality=150, speed=72, compatibility=88, context=60, total=78)


class TestRecommendationResponse:
    def test_build_response(self) -> None:
        hw = HardwareInfo(
            gpu_name="RTX 3060",
            vram_gb=12.0,
            gpu_tier="mid",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        recs = [
            RecommendedModel(
                model_id="qwen3-8b-q4",
                rank=1,
                scores=ModelScores(
                    quality=85, speed=72, compatibility=88, context=60, total=78.5
                ),
                estimated_vram_gb=5.2,
                estimated_tokens_per_sec=45.0,
                runnable=True,
            )
        ]
        upgrades = [
            UpgradeSuggestion(
                current_gpu="NVIDIA GeForce RTX 3060",
                suggested_gpu="NVIDIA GeForce RTX 5070",
                improvement=UpgradeImprovement(
                    vram_delta_gb=4.0,
                    speed_boost_pct=40.0,
                    unlocks_models=["llama3.1-70b-q4"],
                ),
            )
        ]
        response = RecommendationResponse(
            hardware=hw,
            recommendations=recs,
            upgrade_suggestions=upgrades,
        )
        assert response.hardware.gpu_name == "RTX 3060"
        assert len(response.recommendations) == 1
        assert response.recommendations[0].runnable is True
```

- [ ] **Step 4: 运行测试**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_schemas/ -v
```
Expected:
```
tests/test_schemas/test_hardware_schema.py::TestHardwareInput::test_valid_input PASSED
tests/test_schemas/test_hardware_schema.py::TestHardwareInput::test_empty_gpu_name_raises_error PASSED
tests/test_schemas/test_hardware_schema.py::TestHardwareInput::test_negative_ram_raises_error PASSED
tests/test_schemas/test_hardware_schema.py::TestHardwareInput::test_zero_cpu_cores_raises_error PASSED
tests/test_schemas/test_hardware_schema.py::TestHardwareInfo::test_valid_info PASSED
tests/test_schemas/test_recommendation_schema.py::TestModelScores::test_valid_scores PASSED
tests/test_schemas/test_recommendation_schema.py::TestModelScores::test_score_range_clamped PASSED
tests/test_schemas/test_recommendation_schema.py::TestRecommendationResponse::test_build_response PASSED
```

- [ ] **Step 5: Commit**

```bash
git add backend/tests/
git commit -m "test: add schema validation unit tests"
```

---

### Task 16: Repository 单元测试 + .gitignore

**Files:**
- Create: `backend/tests/test_repositories/test_json_gpu_repository.py`
- Create: `backend/tests/test_repositories/test_json_model_repository.py`
- Create/modify: `.gitignore`

- [ ] **Step 1: 创建 test_json_gpu_repository.py**

```python
"""Tests for JsonGpuRepository."""

import pytest
from pathlib import Path
from src.repositories.json_gpu_repository import JsonGpuRepository


@pytest.fixture
def gpu_repo(data_dir: Path) -> JsonGpuRepository:
    return JsonGpuRepository(data_dir / "mock_gpu_specs.json")


class TestJsonGpuRepository:
    def test_get_all_returns_all_gpus(self, gpu_repo: JsonGpuRepository) -> None:
        all_gpus = gpu_repo.get_all()
        assert len(all_gpus) > 0
        assert all(isinstance(g, dict) for g in all_gpus)
        assert all("name" in g for g in all_gpus)

    def test_get_by_name_exact_match(self, gpu_repo: JsonGpuRepository) -> None:
        gpu = gpu_repo.get_by_name("NVIDIA GeForce RTX 3060")
        assert gpu is not None
        assert gpu["vram_gb"] == 12.0
        assert gpu["tier"] == "mid"

    def test_get_by_name_case_insensitive(self, gpu_repo: JsonGpuRepository) -> None:
        gpu = gpu_repo.get_by_name("nvidia geforce rtx 3060")
        assert gpu is not None
        assert gpu["vram_gb"] == 12.0

    def test_get_by_name_not_found(self, gpu_repo: JsonGpuRepository) -> None:
        assert gpu_repo.get_by_name("Fake GPU 9000") is None

    def test_find_closest_match_substring(self, gpu_repo: JsonGpuRepository) -> None:
        # Partial name from WebGPU API
        gpu = gpu_repo.find_closest_match("RTX 4090")
        assert gpu is not None
        assert "4090" in gpu["name"]

    def test_find_closest_match_none(self, gpu_repo: JsonGpuRepository) -> None:
        assert gpu_repo.find_closest_match("") is None
        assert gpu_repo.find_closest_match("CompletelyUnknownGPU") is None

    def test_get_by_tier(self, gpu_repo: JsonGpuRepository) -> None:
        mid_gpus = gpu_repo.get_by_tier("mid")
        assert len(mid_gpus) > 0
        assert all(g["tier"] == "mid" for g in mid_gpus)

    def test_get_next_tier_gpus(self, gpu_repo: JsonGpuRepository) -> None:
        next_tier = gpu_repo.get_next_tier_gpus("entry")
        assert len(next_tier) > 0
        # All returned GPUs should be from tiers above entry
        assert all(g["tier"] in ("mid", "high", "enthusiast") for g in next_tier)
```

- [ ] **Step 2: 创建 test_json_model_repository.py**

```python
"""Tests for JsonModelRepository."""

import pytest
from pathlib import Path
from src.repositories.json_model_repository import JsonModelRepository


@pytest.fixture
def model_repo(data_dir: Path) -> JsonModelRepository:
    return JsonModelRepository(data_dir / "mock_models.json")


class TestJsonModelRepository:
    def test_get_all_paginated(self, model_repo: JsonModelRepository) -> None:
        result = model_repo.get_all(page=1, size=10)
        assert "items" in result
        assert "total" in result
        assert result["page"] == 1
        assert result["size"] == 10
        assert len(result["items"]) <= 10
        assert result["total"] >= len(result["items"])

    def test_get_all_second_page(self, model_repo: JsonModelRepository) -> None:
        page1 = model_repo.get_all(page=1, size=10)
        page2 = model_repo.get_all(page=2, size=10)
        # Items should be different across pages
        page1_ids = {m["id"] for m in page1["items"]}
        page2_ids = {m["id"] for m in page2["items"]}
        assert page1_ids.isdisjoint(page2_ids)

    def test_get_by_id_found(self, model_repo: JsonModelRepository) -> None:
        model = model_repo.get_by_id("qwen3-8b-q4")
        assert model is not None
        assert model["family"] == "Qwen"
        assert model["parameter_count_b"] == 8.0

    def test_get_by_id_not_found(self, model_repo: JsonModelRepository) -> None:
        assert model_repo.get_by_id("nonexistent-model") is None

    def test_get_by_family(self, model_repo: JsonModelRepository) -> None:
        qwen_models = model_repo.get_by_family("Qwen")
        assert len(qwen_models) > 0
        assert all(m["family"] == "Qwen" for m in qwen_models)

    def test_get_by_family_case_insensitive(self, model_repo: JsonModelRepository) -> None:
        qwen_models = model_repo.get_by_family("qwen")
        assert len(qwen_models) > 0

    def test_get_runnable_models(self, model_repo: JsonModelRepository) -> None:
        runnable = model_repo.get_runnable_models(6.0)
        assert len(runnable) > 0
        assert all(m["recommended_vram_gb"] <= 6.0 for m in runnable)

    def test_get_runnable_models_none(self, model_repo: JsonModelRepository) -> None:
        runnable = model_repo.get_runnable_models(0.1)
        assert len(runnable) == 0

    def test_get_all_with_family_filter(self, model_repo: JsonModelRepository) -> None:
        result = model_repo.get_all(family="Llama")
        assert result["total"] > 0
        assert all(m["family"] == "Llama" for m in result["items"])
```

- [ ] **Step 3: 创建 .gitignore（项目根目录）**

```gitignore
# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
backend/venv/
backend/.env

# Node
node_modules/
.next/
out/

# IDE
.vscode/
.idea/

# Superpowers
.superpowers/

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 4: 运行测试**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/ -v
```
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_repositories/ .gitignore
git commit -m "test: add Repository unit tests and .gitignore"
```

---

## 验证清单

Phase 1 完成标准：

- [ ] `cd backend && python -m pytest tests/ -v` — 全部通过
- [ ] `cd backend && uvicorn src.main:app` — 服务启动，`/health` 返回 200
- [ ] `cd frontend && npm run build` — 构建成功
- [ ] `cd frontend && npm run dev` — 开发服务器启动，页面可见 Hero
- [ ] Mock 数据: 50 模型 + 29 GPU，JSON 格式正确
- [ ] Repository 查询功能正常（按名称查找、分页、筛选、tier 过滤）
- [ ] TypeScript 类型与 Pydantic Schema 字段对应
- [ ] i18n 字典覆盖所有 UI 文本 key
- [ ] Dark Mode CSS 变量定义完整
