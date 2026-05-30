# Phase 2: 推荐引擎 + 评分系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 GPU Mapper（GPU 型号 → 显存/等级/性能参数）、四维评分模块（质量/速度/适配度/上下文）、推荐引擎编排层，通过单元测试覆盖 ≥80%。

**Architecture:** 所有推荐逻辑集中在 `backend/src/services/` 下 — `gpu_mapper.py` 负责 GPU 映射，`scoring/` 包含四个独立评分器 + 一个加权合成器，`recommendation_engine.py` 编排完整推荐流水线。每个模块对 Repository 和现有工具函数零耦合依赖（通过依赖注入）。

**Tech Stack:** Python 3.12, pytest, Protocol-based Repository injection

---

## 文件结构预览

```
backend/src/services/
├── __init__.py                              ← (已有)
├── gpu_mapper.py                            ← NEW: GPU 型号 → 规格映射
├── recommendation_engine.py                 ← NEW: 推荐编排
└── scoring/
    ├── __init__.py                          ← NEW: calculate_total_score
    ├── quality.py                           ← NEW: 质量分
    ├── speed.py                             ← NEW: 速度分
    ├── compatibility.py                     ← NEW: 适配分
    └── context.py                           ← NEW: 上下文分

backend/tests/
├── conftest.py                              ← MODIFY: 添加 repo fixtures
├── test_services/
│   ├── __init__.py                          ← NEW
│   ├── test_gpu_mapper.py                   ← NEW
│   ├── test_scoring/
│   │   ├── __init__.py                      ← NEW
│   │   ├── test_quality.py                  ← NEW
│   │   ├── test_speed.py                    ← NEW
│   │   ├── test_compatibility.py            ← NEW
│   │   ├── test_context.py                  ← NEW
│   │   └── test_composite.py                ← NEW
│   └── test_recommendation_engine.py        ← NEW
```

---

### Task 1: GPU Mapper 服务

**Files:**
- Create: `backend/src/services/gpu_mapper.py`
- Create: `backend/tests/test_services/__init__.py`
- Create: `backend/tests/test_services/test_gpu_mapper.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: 编写失败测试 — test_gpu_mapper.py**

```python
"""Tests for GPU Mapper service."""

import pytest
from src.services.gpu_mapper import GpuMapper, GpuMappingError
from src.repositories.json_gpu_repository import JsonGpuRepository


@pytest.fixture
def gpu_repo(data_dir):
    return JsonGpuRepository(data_dir / "mock_gpu_specs.json")


@pytest.fixture
def gpu_mapper(gpu_repo):
    return GpuMapper(gpu_repo)


class TestGpuMapper:
    def test_map_exact_gpu_name_returns_full_spec(self, gpu_mapper):
        """Exact GPU name should return complete spec dict."""
        result = gpu_mapper.map("NVIDIA GeForce RTX 3060")
        assert result is not None
        assert result["name"] == "NVIDIA GeForce RTX 3060"
        assert result["vram_gb"] == 12.0
        assert result["tier"] == "mid"
        assert result["vendor"] == "nvidia"
        assert result["flops_tflops"] is not None

    def test_map_fuzzy_name_finds_closest_match(self, gpu_mapper):
        """Partial/fuzzy name should still resolve via find_closest_match."""
        result = gpu_mapper.map("RTX 4090")
        assert result is not None
        assert "4090" in result["name"]

    def test_map_unknown_gpu_raises_error(self, gpu_mapper):
        """Completely unknown GPU name should raise GpuMappingError."""
        with pytest.raises(GpuMappingError):
            gpu_mapper.map("FakeGPU XYZ-9999")

    def test_map_empty_string_raises_error(self, gpu_mapper):
        """Empty GPU name should raise GpuMappingError."""
        with pytest.raises(GpuMappingError):
            gpu_mapper.map("")

    def test_map_preserves_all_required_fields(self, gpu_mapper):
        """Mapped GPU must contain all fields needed by downstream scorers."""
        result = gpu_mapper.map("RTX 3060")
        required_fields = [
            "name", "vram_gb", "tier", "vendor",
            "benchmark_score", "flops_tflops", "memory_bandwidth_gb_s",
        ]
        for field in required_fields:
            assert field in result, f"Missing required field: {field}"
```

- [ ] **Step 2: 更新 conftest.py 添加测试目录路径**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_gpu_mapper.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'src.services.gpu_mapper'`

- [ ] **Step 3: 实现 gpu_mapper.py**

```python
"""GPU Mapper — resolves browser-reported GPU name to full hardware spec."""

from src.repositories.interfaces import IGpuRepository


class GpuMappingError(Exception):
    """Raised when a GPU name cannot be resolved in the database."""

    def __init__(self, gpu_name: str) -> None:
        self.gpu_name = gpu_name
        super().__init__(f"GPU '{gpu_name}' not found in database")


class GpuMapper:
    """Resolves GPU names from browser detection to full specs.

    Uses IGpuRepository.find_closest_match for fuzzy matching,
    supporting partial names from WebGPU/WebGL APIs.
    """

    def __init__(self, gpu_repo: IGpuRepository) -> None:
        self._gpu_repo = gpu_repo

    def map(self, gpu_name: str) -> dict:
        """Resolve a GPU name to its full specification.

        Args:
            gpu_name: Raw GPU name from browser (may be partial/inexact).

        Returns:
            dict with all GPU spec fields (name, vram_gb, tier, vendor,
            benchmark_score, flops_tflops, memory_bandwidth_gb_s).

        Raises:
            GpuMappingError: If GPU cannot be found in database.
        """
        if not gpu_name or not gpu_name.strip():
            raise GpuMappingError(gpu_name or "")

        gpu = self._gpu_repo.find_closest_match(gpu_name)
        if gpu is None:
            raise GpuMappingError(gpu_name)

        return gpu
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_gpu_mapper.py -v
```
Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/gpu_mapper.py backend/tests/test_services/__init__.py backend/tests/test_services/test_gpu_mapper.py
git commit -m "feat: add GPU Mapper service with fuzzy name resolution"
```

---

### Task 2: 质量评分器 (40%)

**Files:**
- Create: `backend/src/services/scoring/quality.py`
- Create: `backend/tests/test_services/test_scoring/__init__.py`
- Create: `backend/tests/test_services/test_scoring/test_quality.py`

- [ ] **Step 1: 编写失败测试 — test_quality.py**

```python
"""Tests for quality scorer."""

from src.services.scoring.quality import score_quality


class TestScoreQuality:
    def test_returns_model_quality_score(self):
        """Quality score is the pre-stored model quality_score (0-100)."""
        model = {"quality_score": 78}
        result = score_quality(model)
        assert result == 78.0

    def test_returns_float(self):
        """Result should always be a float."""
        model = {"quality_score": 90}
        result = score_quality(model)
        assert isinstance(result, float)

    def test_perfect_score_is_100(self):
        """Max quality score is 100."""
        model = {"quality_score": 100}
        assert score_quality(model) == 100.0

    def test_zero_score(self):
        """Min quality score is 0."""
        model = {"quality_score": 0}
        assert score_quality(model) == 0.0
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_quality.py -v
```
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: 实现 quality.py**

```python
"""Quality scorer — evaluates model quality from pre-stored benchmark scores.

Weight: 40% of total recommendation score.
"""


def score_quality(model: dict) -> float:
    """Return the pre-stored quality score for a model.

    The quality_score is a pre-assigned 0-100 rating based on
    benchmark evaluations (MMLU, HumanEval, etc.).

    Args:
        model: Model spec dict with 'quality_score' key.

    Returns:
        Quality score as float (0-100).
    """
    return float(model["quality_score"])
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_quality.py -v
```
Expected: 4/4 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/scoring/quality.py backend/tests/test_services/test_scoring/__init__.py backend/tests/test_services/test_scoring/test_quality.py
git commit -m "feat: add quality scorer (40% weight)"
```

---

### Task 3: 速度评分器 (25%)

**Files:**
- Create: `backend/src/services/scoring/speed.py`
- Create: `backend/tests/test_services/test_scoring/test_speed.py`

- [ ] **Step 1: 编写失败测试 — test_speed.py**

```python
"""Tests for speed scorer."""

from src.services.scoring.speed import score_speed


# Mock GPU with known performance parameters
MOCK_GPU = {
    "flops_tflops": 12.74,        # RTX 3060
    "memory_bandwidth_gb_s": 360.0,
}

# Mock model: Qwen3 8B Q4
MOCK_MODEL = {
    "parameter_count_b": 8.0,
}


class TestScoreSpeed:
    def test_returns_value_between_0_and_100(self):
        """Speed score must be clamped to 0-100 range."""
        result = score_speed(MOCK_MODEL, MOCK_GPU)
        assert 0 <= result <= 100

    def test_faster_gpu_gives_higher_score(self):
        """A more powerful GPU should yield a higher speed score."""
        slow_gpu = {"flops_tflops": 2.98, "memory_bandwidth_gb_s": 128.0}  # GTX 1650
        fast_gpu = {"flops_tflops": 82.58, "memory_bandwidth_gb_s": 1008.0}  # RTX 4090

        score_slow = score_speed(MOCK_MODEL, slow_gpu)
        score_fast = score_speed(MOCK_MODEL, fast_gpu)
        assert score_fast > score_slow

    def test_smaller_model_gives_higher_score(self):
        """A smaller model should yield higher TPS → higher speed score."""
        small_model = {"parameter_count_b": 1.8}
        large_model = {"parameter_count_b": 32.0}

        score_small = score_speed(small_model, MOCK_GPU)
        score_large = score_speed(large_model, MOCK_GPU)
        assert score_small > score_large

    def test_tps_at_20_gives_100(self):
        """TPS ≥ 20 should cap at 100 (reading speed threshold)."""
        # Qwen3 0.6B on RTX 4090 should easily exceed 20 TPS
        tiny_model = {"parameter_count_b": 0.6}
        beast_gpu = {"flops_tflops": 312.0, "memory_bandwidth_gb_s": 2039.0}  # A100
        result = score_speed(tiny_model, beast_gpu)
        assert result == 100.0  # Capped at 100
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_speed.py -v
```
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: 实现 speed.py**

```python
"""Speed scorer — estimates inference speed (TPS) and converts to 0-100 score.

Weight: 25% of total recommendation score.

Formula (from Jinghong Chen):
    TPOT = Decode_Compute / GPU_FLOPs + (2*N) / GPU_BW
    TPS ≈ 1 / TPOT
    Score = min(100, (TPS / 20) * 100)
"""

from src.utils.vram import estimate_tps


def score_speed(model: dict, gpu: dict) -> float:
    """Calculate speed score based on estimated tokens per second.

    Args:
        model: Model spec dict with 'parameter_count_b' key.
        gpu: GPU spec dict with 'flops_tflops' and 'memory_bandwidth_gb_s' keys.

    Returns:
        Speed score 0-100 (100 = 20+ TPS).
    """
    num_params = int(model["parameter_count_b"] * 1e9)
    gpu_flops = gpu["flops_tflops"] * 1e12
    gpu_bandwidth = gpu["memory_bandwidth_gb_s"]

    tps = estimate_tps(
        num_params=num_params,
        batch_size=1,
        gpu_flops=gpu_flops,
        gpu_bandwidth_gb_s=gpu_bandwidth,
    )

    return min(100.0, (tps / 20.0) * 100.0)
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_speed.py -v
```
Expected: 4/4 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/scoring/speed.py backend/tests/test_services/test_scoring/test_speed.py
git commit -m "feat: add speed scorer (25% weight) with TPS estimation"
```

---

### Task 4: 适配度评分器 (20%)

**Files:**
- Create: `backend/src/services/scoring/compatibility.py`
- Create: `backend/tests/test_services/test_scoring/test_compatibility.py`

- [ ] **Step 1: 编写失败测试 — test_compatibility.py**

```python
"""Tests for compatibility scorer."""

import pytest
from src.services.scoring.compatibility import score_compatibility


class TestScoreCompatibility:
    def test_exact_headroom_50_pct_gives_100(self):
        """50% VRAM headroom → score 100 (perfect compatibility)."""
        result = score_compatibility(
            vram_available=12.0,
            vram_required=8.0,
        )
        assert result == 100.0  # headroom = (12-8)/8 = 0.5 → 0.5/0.5*100 = 100

    def test_zero_headroom_gives_0(self):
        """No headroom (exact match) → near-zero score."""
        result = score_compatibility(
            vram_available=6.0,
            vram_required=6.0,
        )
        assert result == 0.0  # headroom = 0 → 0

    def test_negative_headroom_returns_0(self):
        """Insufficient VRAM → compatibility 0 (filtered out later)."""
        result = score_compatibility(
            vram_available=4.0,
            vram_required=8.0,
        )
        assert result == 0.0  # headroom = -0.5 → clamped to 0

    def test_large_headroom_capped_at_100(self):
        """Very large headroom should cap at 100."""
        result = score_compatibility(
            vram_available=24.0,
            vram_required=2.0,
        )
        assert result == 100.0  # capped

    def test_partial_headroom_gives_proportional_score(self):
        """25% headroom → 50 points."""
        result = score_compatibility(
            vram_available=10.0,
            vram_required=8.0,
        )
        # headroom = (10-8)/8 = 0.25
        # score = (0.25/0.5)*100 = 50.0
        assert result == 50.0

    def test_zero_vram_required_returns_0(self):
        """Edge case: zero required VRAM should not divide by zero."""
        result = score_compatibility(
            vram_available=8.0,
            vram_required=0.0,
        )
        assert result == 0.0
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_compatibility.py -v
```
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: 实现 compatibility.py**

```python
"""Compatibility scorer — evaluates VRAM headroom between GPU and model.

Weight: 20% of total recommendation score.

Formula:
    headroom = (vram_available - vram_required) / vram_required
    score = clamp(headroom / 0.5 * 100, 0, 100)

- headroom >= 50% → score 100 (plenty of VRAM)
- headroom <= 0% → score 0 (insufficient VRAM, will be filtered)
"""


def score_compatibility(vram_available: float, vram_required: float) -> float:
    """Calculate compatibility score based on VRAM headroom.

    Args:
        vram_available: Available GPU VRAM in GB.
        vram_required: Model recommended VRAM in GB.

    Returns:
        Compatibility score 0-100.
    """
    if vram_required <= 0:
        return 0.0

    headroom = (vram_available - vram_required) / vram_required
    score = (headroom / 0.5) * 100.0
    return max(0.0, min(100.0, score))
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_compatibility.py -v
```
Expected: 6/6 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/scoring/compatibility.py backend/tests/test_services/test_scoring/test_compatibility.py
git commit -m "feat: add compatibility scorer (20% weight) with VRAM headroom analysis"
```

---

### Task 5: 上下文评分器 (15%)

**Files:**
- Create: `backend/src/services/scoring/context.py`
- Create: `backend/tests/test_services/test_scoring/test_context.py`

- [ ] **Step 1: 编写失败测试 — test_context.py**

```python
"""Tests for context scorer."""

from src.services.scoring.context import score_context


class TestScoreContext:
    def test_128k_context_gives_100(self):
        """131072 context length → score 100 (max benchmark)."""
        model = {"context_length": 131072, "recommended_vram_gb": 10.0}
        result = score_context(model, vram_available=12.0)
        assert result == 100.0

    def test_32k_context_gives_proportional_score(self):
        """32768 context → ~25% of 131072."""
        model = {"context_length": 32768, "recommended_vram_gb": 6.0}
        result = score_context(model, vram_available=12.0)
        expected = min(100.0, (32768 / 131072) * 100.0)  # = 25.0
        assert result == pytest.approx(expected)

    def test_vram_insufficient_reduces_score(self):
        """When VRAM < recommended, context score is proportionally reduced."""
        model = {"context_length": 131072, "recommended_vram_gb": 22.0}
        result_full = score_context(model, vram_available=44.0)  # plenty of VRAM
        result_limited = score_context(model, vram_available=11.0)  # half the recommended
        assert result_limited < result_full

    def test_vram_exactly_recommended_no_reduction(self):
        """When VRAM == recommended_vram_gb, no reduction applied."""
        model = {"context_length": 65536, "recommended_vram_gb": 6.0}
        # vram_ratio = min(1.0, 6.0/6.0) = 1.0 → no reduction
        result = score_context(model, vram_available=6.0)
        expected = (65536 / 131072) * 100.0
        assert result == pytest.approx(expected)

    def test_score_never_below_zero(self):
        """Score should never be negative."""
        model = {"context_length": 1024, "recommended_vram_gb": 100.0}
        result = score_context(model, vram_available=1.0)
        assert result >= 0.0
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_context.py -v
```
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: 实现 context.py**

```python
"""Context scorer — evaluates model context length relative to 128K benchmark.

Weight: 15% of total recommendation score.

Formula:
    base_score = min(100, (model_context / 131072) * 100)
    vram_ratio = min(1.0, vram_available / recommended_vram_gb)
    final_score = base_score * vram_ratio

The VRAM ratio reduces the score when the GPU may not have enough memory
to fully utilize the model's maximum context length.
"""


def score_context(model: dict, vram_available: float) -> float:
    """Calculate context score based on model context length and VRAM.

    Args:
        model: Model spec dict with 'context_length' and 'recommended_vram_gb'.
        vram_available: Available GPU VRAM in GB.

    Returns:
        Context score 0-100.
    """
    context_length = model["context_length"]
    recommended_vram = model["recommended_vram_gb"]

    base_score = min(100.0, (context_length / 131072.0) * 100.0)

    if recommended_vram > 0:
        vram_ratio = min(1.0, vram_available / recommended_vram)
    else:
        vram_ratio = 1.0

    return max(0.0, base_score * vram_ratio)
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_context.py -v
```
Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/scoring/context.py backend/tests/test_services/test_scoring/test_context.py
git commit -m "feat: add context scorer (15% weight) with VRAM-aware adjustment"
```

---

### Task 6: 复合评分合成器 + Scoring __init__.py

**Files:**
- Update: `backend/src/services/scoring/__init__.py` (已有占位文件)
- Create: `backend/tests/test_services/test_scoring/test_composite.py`

- [ ] **Step 1: 编写失败测试 — test_composite.py**

```python
"""Tests for composite scoring function."""

from src.services.scoring import calculate_total_score


class TestCalculateTotalScore:
    def test_perfect_all_scores_yields_100(self):
        """All sub-scores at 100 → total should be 100."""
        scores = {
            "quality": 100.0,
            "speed": 100.0,
            "compatibility": 100.0,
            "context": 100.0,
        }
        result = calculate_total_score(scores)
        assert result == 100.0

    def test_zero_all_scores_yields_0(self):
        """All sub-scores at 0 → total should be 0."""
        scores = {
            "quality": 0.0,
            "speed": 0.0,
            "compatibility": 0.0,
            "context": 0.0,
        }
        result = calculate_total_score(scores)
        assert result == 0.0

    def test_weighted_average_correct(self):
        """Verify weights: 0.40*Q + 0.25*S + 0.20*C + 0.15*X."""
        scores = {
            "quality": 80.0,
            "speed": 60.0,
            "compatibility": 70.0,
            "context": 50.0,
        }
        result = calculate_total_score(scores)
        expected = 0.40 * 80 + 0.25 * 60 + 0.20 * 70 + 0.15 * 50
        assert result == pytest.approx(expected)

    def test_weights_sum_to_one(self):
        """Weights should sum to 1.0 for a proper weighted average."""
        import src.services.scoring as scoring
        total_weight = (
            scoring.WEIGHT_QUALITY
            + scoring.WEIGHT_SPEED
            + scoring.WEIGHT_COMPATIBILITY
            + scoring.WEIGHT_CONTEXT
        )
        assert total_weight == pytest.approx(1.0)

    def test_result_never_exceeds_100(self):
        """Total score should stay within 0-100 range."""
        scores = {
            "quality": 150.0,   # outlier (though scorers clamp to 100)
            "speed": 200.0,
            "compatibility": 300.0,
            "context": 999.0,
        }
        result = calculate_total_score(scores)
        assert result <= 100.0

    def test_result_never_below_0(self):
        """Total score should never go negative."""
        scores = {
            "quality": -10.0,
            "speed": -5.0,
            "compatibility": -3.0,
            "context": -1.0,
        }
        result = calculate_total_score(scores)
        assert result >= 0.0
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_composite.py -v
```
Expected: FAIL — `calculate_total_score` not defined in `__init__.py`

- [ ] **Step 3: 重写 scoring/__init__.py**

```python
"""Scoring module — composite scoring system for model recommendations.

Weights (must sum to 1.0):
    Quality:        40% — pre-stored model quality benchmark
    Speed:          25% — estimated TPS vs 20 TPS threshold
    Compatibility:  20% — VRAM headroom analysis
    Context:        15% — context length vs 128K benchmark
"""

# Weights
WEIGHT_QUALITY = 0.40
WEIGHT_SPEED = 0.25
WEIGHT_COMPATIBILITY = 0.20
WEIGHT_CONTEXT = 0.15

# Scoring functions
from src.services.scoring.quality import score_quality  # noqa: E402, F401
from src.services.scoring.speed import score_speed  # noqa: E402, F401
from src.services.scoring.compatibility import score_compatibility  # noqa: E402, F401
from src.services.scoring.context import score_context  # noqa: E402, F401


def calculate_total_score(scores: dict[str, float]) -> float:
    """Calculate weighted composite score.

    Args:
        scores: dict with keys 'quality', 'speed', 'compatibility', 'context'.
                Each value should be 0-100.

    Returns:
        Weighted total score 0-100.

    Formula:
        Score_total = 0.40*Q + 0.25*S + 0.20*C + 0.15*X
    """
    total = (
        WEIGHT_QUALITY * scores["quality"]
        + WEIGHT_SPEED * scores["speed"]
        + WEIGHT_COMPATIBILITY * scores["compatibility"]
        + WEIGHT_CONTEXT * scores["context"]
    )
    return max(0.0, min(100.0, total))
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_scoring/test_composite.py -v
```
Expected: 6/6 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/scoring/__init__.py backend/tests/test_services/test_scoring/test_composite.py
git commit -m "feat: add composite scorer with weighted formula (0.40/0.25/0.20/0.15)"
```

---

### Task 7: 推荐引擎编排层

**Files:**
- Create: `backend/src/services/recommendation_engine.py`
- Create: `backend/tests/test_services/test_recommendation_engine.py`

- [ ] **Step 1: 编写失败测试 — test_recommendation_engine.py**

```python
"""Tests for RecommendationEngine."""

import pytest
from src.repositories.json_gpu_repository import JsonGpuRepository
from src.repositories.json_model_repository import JsonModelRepository
from src.services.gpu_mapper import GpuMapper
from src.services.recommendation_engine import RecommendationEngine
from src.schemas.hardware import HardwareInput


@pytest.fixture
def engine(data_dir):
    """Create a real RecommendationEngine with JSON repositories."""
    gpu_repo = JsonGpuRepository(data_dir / "mock_gpu_specs.json")
    model_repo = JsonModelRepository(data_dir / "mock_models.json")
    gpu_mapper = GpuMapper(gpu_repo)
    return RecommendationEngine(
        gpu_repo=gpu_repo,
        model_repo=model_repo,
        gpu_mapper=gpu_mapper,
    )


class TestRecommendationEngine:
    def test_recommend_returns_ordered_results(self, engine):
        """Recommendations should be sorted by total score descending."""
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 3060",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        response = engine.recommend(hw)
        assert len(response.recommendations) > 0
        # Verify ordering
        scores = [r.scores.total for r in response.recommendations]
        assert scores == sorted(scores, reverse=True)

    def test_recommend_includes_hardware_info(self, engine):
        """Response must include resolved hardware info."""
        hw = HardwareInput(
            gpu_name="RTX 3060",
            ram_gb=32.0,
            cpu_cores=16,
            os="Windows",
        )
        response = engine.recommend(hw)
        assert response.hardware.gpu_name == "NVIDIA GeForce RTX 3060"
        assert response.hardware.vram_gb == 12.0
        assert response.hardware.gpu_tier == "mid"

    def test_recommend_all_runnable_models_have_scores(self, engine):
        """Every recommended model must have a complete scores object."""
        hw = HardwareInput(
            gpu_name="RTX 4090",
            ram_gb=64.0,
            cpu_cores=32,
            os="Windows",
        )
        response = engine.recommend(hw)
        for rec in response.recommendations:
            assert rec.scores.quality > 0
            assert rec.scores.speed > 0
            assert rec.scores.compatibility > 0
            assert rec.scores.context > 0
            assert rec.scores.total > 0
            assert rec.runnable is True

    def test_recommend_top_count_is_10_or_less(self, engine):
        """Should return at most 10 recommendations."""
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 4090",
            ram_gb=64.0,
            cpu_cores=32,
            os="Windows",
        )
        response = engine.recommend(hw)
        assert len(response.recommendations) <= 10

    def test_recommend_with_low_vram_gpu_returns_fewer_models(self, engine):
        """Low VRAM GPU should have fewer runnable models."""
        hw_low = HardwareInput(
            gpu_name="NVIDIA GeForce GTX 1650",
            ram_gb=8.0,
            cpu_cores=4,
            os="Windows",
        )
        hw_high = HardwareInput(
            gpu_name="NVIDIA GeForce RTX 4090",
            ram_gb=64.0,
            cpu_cores=32,
            os="Windows",
        )
        resp_low = engine.recommend(hw_low)
        resp_high = engine.recommend(hw_high)
        assert len(resp_low.recommendations) <= len(resp_high.recommendations)

    def test_recommend_generates_upgrade_suggestions(self, engine):
        """Should generate upgrade suggestions when better GPUs exist."""
        hw = HardwareInput(
            gpu_name="NVIDIA GeForce GTX 1650",
            ram_gb=8.0,
            cpu_cores=4,
            os="Windows",
        )
        response = engine.recommend(hw)
        assert len(response.upgrade_suggestions) > 0
        for suggestion in response.upgrade_suggestions:
            assert suggestion.current_gpu == "NVIDIA GeForce GTX 1650"
            assert suggestion.suggested_gpu != ""
            assert suggestion.improvement.vram_delta_gb > 0

    def test_recommend_top_tier_gpu_has_no_upgrade(self, engine):
        """Enthusiast tier GPU should have empty upgrade suggestions."""
        hw = HardwareInput(
            gpu_name="NVIDIA A100",
            ram_gb=256.0,
            cpu_cores=64,
            os="Linux",
        )
        response = engine.recommend(hw)
        # A100 is already top tier — no upgrade needed
        assert len(response.upgrade_suggestions) == 0

    def test_recommend_unknown_gpu_raises_error(self, engine):
        """Completely unknown GPU should raise an error."""
        hw = HardwareInput(
            gpu_name="Nonexistent GPU XYZ",
            ram_gb=16.0,
            cpu_cores=8,
            os="Windows",
        )
        from src.services.gpu_mapper import GpuMappingError
        with pytest.raises(GpuMappingError):
            engine.recommend(hw)
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_recommendation_engine.py -v
```
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: 实现 recommendation_engine.py**

```python
"""Recommendation Engine — orchestrates GPU mapping, scoring, filtering, and sorting.

Single entry point for the recommendation pipeline.
"""

from src.repositories.interfaces import IGpuRepository, IModelRepository
from src.services.gpu_mapper import GpuMapper
from src.services.scoring import (
    score_quality,
    score_speed,
    score_compatibility,
    score_context,
    calculate_total_score,
)
from src.schemas.hardware import HardwareInput, HardwareInfo
from src.schemas.recommendation import (
    ModelScores,
    RecommendedModel,
    UpgradeImprovement,
    UpgradeSuggestion,
    RecommendationResponse,
)
from src.utils.vram import estimate_vram_simple, estimate_tps


class RecommendationEngine:
    """Core recommendation engine.

    Pipeline:
        1. GPU Mapping — resolve browser GPU name to full spec
        2. Model Filtering — find runnable models for this GPU
        3. Scoring — evaluate each model across 4 dimensions
        4. Sorting — rank by composite score descending
        5. Upgrades — suggest GPU upgrades that unlock more models
    """

    TOP_N = 10

    def __init__(
        self,
        gpu_repo: IGpuRepository,
        model_repo: IModelRepository,
        gpu_mapper: GpuMapper,
    ) -> None:
        self._gpu_repo = gpu_repo
        self._model_repo = model_repo
        self._gpu_mapper = gpu_mapper

    def recommend(self, hardware: HardwareInput) -> RecommendationResponse:
        """Run full recommendation pipeline.

        Args:
            hardware: Browser-detected hardware profile.

        Returns:
            Complete recommendation response with ranked models and upgrade tips.
        """
        # Step 1: Map GPU name to full spec
        gpu = self._gpu_mapper.map(hardware.gpu_name)
        vram_available = gpu["vram_gb"]

        # Step 2: Build resolved hardware info
        hardware_info = HardwareInfo(
            gpu_name=gpu["name"],
            vram_gb=vram_available,
            gpu_tier=gpu["tier"],
            ram_gb=hardware.ram_gb,
            cpu_cores=hardware.cpu_cores,
            os=hardware.os,
        )

        # Step 3: Get and score runnable models
        candidates = self._model_repo.get_runnable_models(vram_available)
        scored = self._score_models(candidates, gpu, vram_available)

        # Step 4: Sort by total score descending
        scored.sort(key=lambda x: x[1]["total"], reverse=True)

        # Step 5: Build top N recommendations
        recommendations = []
        for rank, (model, scores_dict) in enumerate(
            scored[: self.TOP_N], start=1
        ):
            estimated_vram = estimate_vram_simple(
                model["parameter_count_b"],
                model["quantization_bits"],
            )
            tps = estimate_tps(
                num_params=int(model["parameter_count_b"] * 1e9),
                batch_size=1,
                gpu_flops=gpu["flops_tflops"] * 1e12,
                gpu_bandwidth_gb_s=gpu["memory_bandwidth_gb_s"],
            )

            recommendations.append(
                RecommendedModel(
                    model_id=model["id"],
                    rank=rank,
                    scores=ModelScores(**scores_dict),
                    estimated_vram_gb=round(estimated_vram, 1),
                    estimated_tokens_per_sec=round(tps, 1),
                    runnable=True,
                )
            )

        # Step 6: Generate upgrade suggestions
        upgrades = self._generate_upgrades(gpu)

        return RecommendationResponse(
            hardware=hardware_info,
            recommendations=recommendations,
            upgrade_suggestions=upgrades,
        )

    def _score_models(
        self, models: list[dict], gpu: dict, vram_available: float
    ) -> list[tuple[dict, dict[str, float]]]:
        """Score each model across all 4 dimensions.

        Returns:
            List of (model_dict, scores_dict) tuples.
        """
        results = []
        for model in models:
            scores = {
                "quality": score_quality(model),
                "speed": score_speed(model, gpu),
                "compatibility": score_compatibility(
                    vram_available, model["recommended_vram_gb"]
                ),
                "context": score_context(model, vram_available),
            }
            scores["total"] = calculate_total_score(scores)
            results.append((model, scores))
        return results

    def _generate_upgrades(self, current_gpu: dict) -> list[UpgradeSuggestion]:
        """Generate upgrade suggestions based on next-tier GPUs.

        For each tier above current, picks the best GPU (by benchmark_score).
        Limits to top 3 upgrade paths.
        """
        next_tier_gpus = self._gpu_repo.get_next_tier_gpus(
            current_gpu["tier"]
        )
        if not next_tier_gpus:
            return []

        # Group by tier, pick best GPU in each tier
        tier_best: dict[str, dict] = {}
        for gpu in next_tier_gpus:
            tier = gpu["tier"]
            if (
                tier not in tier_best
                or gpu["benchmark_score"]
                > tier_best[tier]["benchmark_score"]
            ):
                tier_best[tier] = gpu

        suggestions = []
        current_vram = current_gpu["vram_gb"]
        current_score = current_gpu["benchmark_score"]

        for tier in ["mid", "high", "enthusiast"]:
            if tier not in tier_best:
                continue
            gpu = tier_best[tier]

            vram_delta = gpu["vram_gb"] - current_vram
            speed_boost = (
                (gpu["benchmark_score"] - current_score)
                / current_score
                * 100.0
            )

            # Find models unlocked by this upgrade
            current_runnable = {
                m["id"]
                for m in self._model_repo.get_runnable_models(current_vram)
            }
            upgraded_runnable = {
                m["id"]
                for m in self._model_repo.get_runnable_models(
                    gpu["vram_gb"]
                )
            }
            unlocked = sorted(upgraded_runnable - current_runnable)[:5]

            suggestions.append(
                UpgradeSuggestion(
                    current_gpu=current_gpu["name"],
                    suggested_gpu=gpu["name"],
                    improvement=UpgradeImprovement(
                        vram_delta_gb=round(vram_delta, 1),
                        speed_boost_pct=round(speed_boost, 1),
                        unlocks_models=unlocked,
                    ),
                )
            )

        # Return top 3 suggestions sorted by VRAM delta
        suggestions.sort(
            key=lambda s: s.improvement.vram_delta_gb, reverse=False
        )
        return suggestions[:3]
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/test_services/test_recommendation_engine.py -v
```
Expected: 8/8 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/recommendation_engine.py backend/tests/test_services/test_recommendation_engine.py
git commit -m "feat: add RecommendationEngine with full scoring pipeline and upgrade suggestions"
```

---

### Task 8: 更新推荐 API 路由 + 运行全量测试 + 覆盖率检查

**Files:**
- Modify: `backend/src/api/recommend.py`

- [ ] **Step 1: 更新 recommend.py 接入推荐引擎**

```python
"""Recommendation endpoint."""

from fastapi import APIRouter, HTTPException

from src.schemas.common import ApiResponse
from src.schemas.hardware import HardwareInput
from src.schemas.recommendation import RecommendationResponse
from src.repositories.json_gpu_repository import JsonGpuRepository
from src.repositories.json_model_repository import JsonModelRepository
from src.services.gpu_mapper import GpuMapper, GpuMappingError
from src.services.recommendation_engine import RecommendationEngine
from src.core.exceptions import GpuNotFoundError, InputValidationError

router = APIRouter(prefix="/recommend", tags=["recommend"])

# --- Bootstrap (Phase 2: JSON repos; Phase 4: SQL repos) ---
import os

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_gpu_repo = JsonGpuRepository(os.path.join(_DATA_DIR, "mock_gpu_specs.json"))
_model_repo = JsonModelRepository(os.path.join(_DATA_DIR, "mock_models.json"))
_gpu_mapper = GpuMapper(_gpu_repo)
_engine = RecommendationEngine(
    gpu_repo=_gpu_repo,
    model_repo=_model_repo,
    gpu_mapper=_gpu_mapper,
)


@router.post("", response_model=ApiResponse[RecommendationResponse])
async def recommend(hardware: HardwareInput) -> ApiResponse[RecommendationResponse]:
    """Submit hardware profile and get ranked model recommendations."""
    try:
        result = _engine.recommend(hardware)
        return ApiResponse.ok(result)
    except GpuMappingError as exc:
        raise HTTPException(
            status_code=404,
            detail={"message": str(exc)},
        )
```

- [ ] **Step 2: 运行全量测试**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/ -v
```
Expected: 所有测试 PASS（60+ tests）

- [ ] **Step 3: 运行覆盖率检查**

Run:
```bash
cd backend && source venv/Scripts/activate
python -m pytest tests/ --cov=src/services --cov=src/utils --cov-report=term-missing
```
Expected: services/ ≥ 80%, utils/vram.py ≥ 80%

- [ ] **Step 4: 启动后端验证 API 实际响应**

Run:
```bash
cd backend && source venv/Scripts/activate
uvicorn src.main:app --host 127.0.0.1 --port 8000 &
sleep 2
curl -s -X POST http://localhost:8000/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"gpuName":"NVIDIA GeForce RTX 3060","ramGb":32,"cpuCores":16,"os":"Windows"}' | python -m json.tool | head -30
kill %1
```
Expected: 返回包含 `success: true` 和 `data.recommendations` 的 JSON 响应

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/recommend.py
git commit -m "feat: wire recommendation API to RecommendationEngine"
```

---

## 验证清单

Phase 2 完成标准：

- [ ] `cd backend && python -m pytest tests/ -v` — 全部通过 (≥60 tests)
- [ ] `cd backend && python -m pytest tests/ --cov=src/services --cov=src/utils` — services/ coverage ≥ 80%
- [ ] GPU Mapper: 精确匹配 + 模糊匹配 + 未知 GPU 报错
- [ ] 质量评分器: model.quality_score → 0-100 float
- [ ] 速度评分器: TPS 估算 → 0-100 score; 更强 GPU > 更弱 GPU
- [ ] 适配度评分器: VRAM headroom 分析; 不足 → 0; 充裕 → 100
- [ ] 上下文评分器: context length vs 128K; VRAM 不足时降分
- [ ] 复合评分: 加权公式 0.40/0.25/0.20/0.15 正确
- [ ] 推荐引擎: 排序降序、Top 10、升级建议生成
- [ ] API 路由: POST /api/v1/recommend 返回正确的 RecommendationResponse
- [ ] 前端 TypeScript 编译无错误（无破坏性变更）

---

## 设计决策记录

1. **score_compatibility 阈值**: design doc 用 `recommended_vram_gb` 计算 headroom（非 `min_vram_gb`），因为 recommended 是合理运行的推荐值，min 是勉强运行的最低值。
2. **非可运行模型过滤**: 通过 `get_runnable_models(max_vram_gb)` 在 Repository 层过滤（`recommended_vram_gb <= vram_available`），引擎不再额外处理非可运行模型。
3. **升级建议策略**: 每个高层级选 benchmark_score 最高的 GPU，返回最多 3 条建议（mid → high → enthusiast）。
4. **无依赖循环**: 评分模块不导入 Repository 或 Engine，仅接受数据 dict；Engine 编排各模块。
5. **API 层依赖注入**: Phase 2 在 API 模块直接实例化 JSON Repository（简单直接），Phase 4 迁移到 FastAPI Depends 注入。
