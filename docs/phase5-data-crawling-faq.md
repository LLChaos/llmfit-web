# Phase 5 数据自动爬取 — 技术方案

> 日期：2026-06-02
> 关联：`docs/scoring-formula-report.md` · `project.md` · `CLAUDE.md`

---

## 1. HuggingFace API 限流机制

### 不是"总共 500 次"，是"每 5 分钟 500 次"

来自 [HuggingFace 官方文档](https://huggingface.co/docs/hub/rate-limits)：

| 计划 | 每 5 分钟 API 调用 | 下载请求 |
|------|:--:|:--:|
| 匿名 (per IP) | **500** | 3,000 |
| 免费登录 | 1,000 | 5,000 |
| PRO | 2,500 | 12,000 |

### 本项目的消耗估算

单次爬取 run（爬取 100 个模型）：

```
1 次 list_models(fetch_config=True, limit=100)     ← 批量获取元数据 + config.json
100 次 repo_info(files_metadata=True)              ← 每个模型查一次 GGUF 文件列表
+ 少量 config.json 单独下载（list_models 未返回的）
─────────────────────────────────────────────
≈ 105 次 API 调用 / run
```

**结论**：匿名模式也足以支持每次 100+ 模型。后续可注册 HF 账号免费获得 1,000 次/5min 配额。

---

## 2. 数据获取方式

### 模型数据 — `huggingface_hub` Python SDK

```python
from huggingface_hub import HfApi, hf_hub_download

api = HfApi()

# ① 批量获取热门文本生成模型（1 次 API 调用，含 config.json）
models = list(api.list_models(
    task="text-generation",
    sort="downloads",
    direction=-1,
    limit=100,
    fetch_config=True,  # 顺带返回 config.json，不额外消耗配额
))

for model in models:
    # model.id        → "Qwen/Qwen3-8B"
    # model.downloads → 1234567
    # model.likes     → 456
    # model.config    → {"hidden_size": 4096, "num_hidden_layers": 32, ...}

    # ② 列出仓库中的 GGUF 量化文件（1 次 API 调用/模型）
    info = api.repo_info(model.id, files_metadata=True)
    gguf_files = [
        s.rfilename for s in info.siblings
        if s.rfilename.endswith(".gguf")
    ]
    # → ["qwen3-8b-q4_k_m.gguf", "qwen3-8b-q8_0.gguf"]

    # ③ 如果 fetch_config=True 未返回 config，单独下载
    config_path = hf_hub_download(model.id, "config.json")
    with open(config_path) as f:
        config = json.load(f)
```

**关键优势**：
- `list_models(fetch_config=True)` 一次调用拿到元数据 + 架构参数
- `repo_info()` 不消耗下载配额，只在 API 配额计数
- `hf_hub_download()` 走 CDN 缓存，本地只下载一次

### GPU 数据 — `dbgpu` 包（离线数据库）

```python
from dbgpu import GPUDatabase

# dbgpu 把 TechPowerUp 数据打包成 Python 包内的 SQLite 文件
db = GPUDatabase.default()  # ← 加载本地数据库，不联网

spec = db["GeForce RTX 4090"]
# spec.name                           → "GeForce RTX 4090"
# spec.manufacturer                   → "NVIDIA"
# spec.memory_size_gb                 → 24.0
# spec.memory_bandwidth_gb_s          → 1008.0
# spec.single_float_performance_gflop_s → 82580.0 (→ 82.58 TFLOPS)

# 遍历全部 2000+ GPU
for key in db._gpu_list:
    spec = db[key]
```

**非实时爬取**：`dbgpu` 是预编译的本地数据库（MIT 开源），不是运行时爬虫。对 dbgpu 未覆盖的最新 GPU，用 `backend/src/data/gpu_overrides.json` 手动补丁。

---

## 3. 数据写入逻辑链

```
                      ┌─── 纯函数（可单元测试）───┐          ┌─── DB 写入 ───┐
                      │                          │          │               │
HF API ──→ 原始 dict  │  build_model_record()     │ → dict   │  pg_insert()  │ → PostgreSQL
dbgpu ──→ 原始 dict  │  map_dbgpu_to_record()    │ → dict   │  .on_conflict  │ → PostgreSQL
                      │                          │          │  .do_update()  │
                      └──────────────────────────┘          └───────────────┘
                       src/services/                         scripts/ 层
                       (数据转换逻辑)                        (DB 会话管理)
```

### 具体流程（模型爬取为例）

```
1. HfApi.list_models() → 返回 100 个 ModelInfo 对象
        ↓
2. 对每个模型：
   a. 从 model.config 提取 hidden_size, num_hidden_layers, max_position_embeddings
   b. repo_info() 列出 GGUF 文件 → 解析出 Q4_K_M, Q8_0 等量化变体
   c. 对每个量化变体：
      - generate_model_slug()     → "qwen3-8b-q4-k-m"
      - estimate_quality_from_hf() → 78
      - estimate_vram_simple()     → 4.8 GB（复用 src/utils/vram.py）
      - build_model_record()       → 完整 dict，17 个字段全部填充
        ↓
3. pg_insert(Model).values(**record).on_conflict_do_update(...)
   session.execute(stmt)
        ↓
4. session.commit() → PostgreSQL
```

### 架构原则

| 原则 | 实现 |
|------|------|
| 业务逻辑与 DB 分离 | `src/services/` 的爬虫函数只做数据转换，接收 Session 但不管理其生命周期 |
| DB 会话由 CLI 层管理 | `scripts/` 创建 engine、开启 session、提交/回滚 |
| 幂等写入 | `pg_insert().on_conflict_do_update(slug)` — 重复运行不产生重复数据 |
| 遵循 seed.py 模式 | CLI 脚本结构与 Phase 4 的 `scripts/seed.py` 完全一致 |

---

## 4. 字段映射与数据正确性

### 第一层防护：强类型 ORM 模型

`src/models/__init__.py` 定义了每个字段的类型和约束：

```python
class Model(Base):
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    parameter_count_b: Mapped[float] = mapped_column(Float, nullable=False)
    quantization_bits: Mapped[int] = mapped_column(Integer, nullable=False)
    # ... 15 个 NOT NULL 字段
```

爬虫产出 dict 缺字段或类型错误 → SQLAlchemy 抛 `IntegrityError`，**不会悄悄写入坏数据**。

### 第二层防护：`build_model_record()` 显式映射

不依赖字段名巧合。函数内部逐字段赋值，每个值的来源可追踪：

```python
def build_model_record(hf_model, config, quant) -> dict:
    slug = generate_model_slug(family, param_count, quant_label)
    vram = estimate_vram_simple(param_count, quant_bits)

    return {
        "slug":                slug,                     # 计算
        "family":              hf_model["author"],       # ← HF 明确字段
        "name":                f"{family} {size}B {quant_label}",
        "parameter_count_b":   round(param_count, 1),    # 计算
        "quantization":        quant_label,              # 解析自 GGUF 文件名
        "quantization_bits":   quant_bits,
        "min_vram_gb":         round(vram * 0.7, 1),    # 估算
        "recommended_vram_gb": round(vram, 1),           # 估算
        "context_length":      config.get("context_len"), # ← config.json
        "hidden_dim":          config.get("hidden_dim"),  # ← config.json
        "num_layers":          config.get("num_layers"),  # ← config.json
        "quality_score":       estimate_quality(downloads, likes),
        "download_url":        f"https://huggingface.co/{repo_id}",
        "huggingface_repo":    repo_id,
    }
```

### 第三层防护：config.json 字段兼容

不同模型架构用不同键名。用 fallback 链处理：

```python
def _extract_hidden_dim(config: dict) -> int:
    """Robust extraction with fallback chain."""
    for key in ("hidden_size", "d_model", "dim", "n_embd"):
        if key in config and isinstance(config[key], int):
            return config[key]
    raise KeyError(f"Cannot determine hidden_dim from: {list(config)}")

def _extract_num_layers(config: dict) -> int:
    for key in ("num_hidden_layers", "n_layers", "num_layers"):
        if key in config and isinstance(config[key], int):
            return config[key]
    raise KeyError(f"Cannot determine num_layers from: {list(config)}")

def _extract_context_length(config: dict) -> int:
    for key in ("max_position_embeddings", "n_positions", "n_ctx"):
        if key in config and isinstance(config[key], int):
            return config[key]
    raise KeyError(f"Cannot determine context_length from: {list(config)}")
```

### 验证手段

| 阶段 | 方法 |
|------|------|
| 开发时 | `--dry-run` 打印所有即将写入的数据，人工抽查 |
| 测试时 | 单元测试覆盖每个转换函数，SQLite 内存库验证写入 |
| 运行时 | SQLAlchemy IntegrityError → 立即暴露字段缺失/类型错误 |
| 幂等性 | 重复运行 `python -m scripts.crawl_models` → `updated_at` 刷新，无重复行 |

---

## 依赖

```toml
# pyproject.toml 新增
"huggingface-hub>=0.26.0",   # HF API SDK
"dbgpu>=2025.12",             # GPU 离线数据库
```
