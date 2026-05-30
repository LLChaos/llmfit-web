# LLMFit Web — MVP 设计文档

> 日期：2026-05-31
> 状态：已确认
> 阶段：MVP

---

## 1. 项目概述

**LLMFit Web** 是一个面向本地大模型用户的硬件适配推荐平台。

用户打开网站 → 浏览器自动检测硬件 → 上传配置 → 后端分析 → 返回推荐模型列表 + 升级建议。

### 1.1 MVP 范围

**包含：**
- 浏览器硬件检测（GPU / RAM / CPU / OS）
- GPU 映射系统（GPU 型号 → 显存 → 性能等级）
- 模型数据库（首批 50 个模型，5 个家族）
- 推荐引擎（过滤 + 评分 + 排序）
- 模型评分系统（质量 40% / 速度 25% / 适配 20% / 上下文 15%）
- 前端单页面应用（首页 + 推荐结果 + 模型详情弹窗）
- Docker 部署
- 测试（pytest + vitest，覆盖率 ≥ 80%）

**不包含：**
- 用户系统 / 登录 / 注册
- 支付系统
- 模型推理
- AI 聊天
- 社区功能
- Agent 系统
- 云 GPU

### 1.2 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Next.js 15 · TypeScript · TailwindCSS · Shadcn UI · TanStack Query · Zustand |
| 后端 | Python 3.12 · FastAPI · SQLAlchemy · Pydantic · Alembic |
| 数据库 | PostgreSQL (Supabase) |
| 部署 | Vercel (前端) · Railway (后端) · Docker |

---

## 2. 架构设计

### 2.1 整体架构

```
Browser (WebGPU + Navigator API)
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend: Next.js 15 (Vercel)      │
│  Hardware Detection → API → Display │
└─────────────────────────────────────┘
       │ POST /api/v1/recommend
       ▼
┌─────────────────────────────────────┐
│  Backend: FastAPI (Railway)         │
│  Router → Engine → GPU Mapper →     │
│  Scoring → Repository               │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Database: PostgreSQL (Supabase)    │
│  gpu_specs · models                 │
└─────────────────────────────────────┘
```

### 2.2 后端分层架构

```
backend/src/
├── api/              ← 路由层，仅做参数校验和响应格式化，禁止业务逻辑
│   ├── recommend.py  ← POST /api/v1/recommend
│   └── models.py     ← GET /api/v1/models, GET /api/v1/models/{id}
├── services/
│   ├── recommendation_engine.py   ← 核心推荐编排
│   ├── gpu_mapper.py              ← GPU 型号 → 显存/等级/性能参数
│   └── scoring/
│       ├── __init__.py            ← 综合评分入口
│       ├── quality.py             ← 质量分 (40%)
│       ├── speed.py               ← 速度分 (25%)
│       ├── compatibility.py       ← 适配分 (20%)
│       └── context.py             ← 上下文分 (15%)
├── repositories/
│   ├── interfaces.py              ← IModelRepository / IGpuRepository Protocol
│   ├── json_model_repository.py   ← Phase 1: JSON 文件实现
│   ├── json_gpu_repository.py     ← Phase 1: JSON 文件实现
│   └── (sql_*.py)                 ← Phase 4+: SQL 实现 (未来)
├── models/
│   ├── gpu_spec.py                ← SQLAlchemy ORM (Phase 4+)
│   └── model_spec.py              ← SQLAlchemy ORM (Phase 4+)
├── schemas/
│   ├── hardware.py                ← HardwareInput / HardwareInfo
│   ├── recommendation.py          ← RecommendationResponse / ModelScore
│   └── model.py                   ← ModelDetail / ModelListResponse
├── core/
│   ├── config.py                  ← Settings (env vars)
│   └── exceptions.py              ← 自定义异常
├── utils/
│   └── vram.py                    ← VRAM 估算工具函数
├── data/
│   ├── mock_models.json           ← 50 模型数据
│   └── mock_gpu_specs.json        ← 30+ GPU 数据
└── tests/
    ├── test_recommendation_engine.py
    ├── test_gpu_mapper.py
    ├── test_scoring/
    └── test_api/
```

### 2.3 前端分层架构

> **设计决策：单页面应用** — 所有交互在一个页面完成，模型详情通过 Modal 展示，无需路由跳转。

```
frontend/src/
├── app/
│   └── page.tsx                    ← 唯一页面（单页面应用）
├── components/
│   ├── ui/                         ← Shadcn UI 组件
│   ├── hero-section.tsx            ← Hero 区域 + 检测按钮
│   ├── hardware-card.tsx           ← 硬件信息卡片
│   ├── recommendation-list.tsx     ← 推荐列表（Top 10）
│   ├── model-card.tsx              ← 模型推荐卡片
│   ├── model-detail-modal.tsx      ← 模型详情弹窗
│   ├── upgrade-suggestions.tsx     ← 升级建议
│   └── language-switcher.tsx       ← 中英文切换按钮
├── features/
│   └── hardware-detection.ts       ← 浏览器硬件检测逻辑
├── hooks/
│   ├── use-hardware-detection.ts   ← 硬件检测 Hook
│   ├── use-recommendations.ts      ← TanStack Query Hook
│   └── use-translation.ts          ← i18n 翻译 Hook
├── services/
│   └── api-client.ts              ← API 请求封装
├── stores/
│   ├── hardware-store.ts          ← Zustand: 硬件检测状态
│   └── locale-store.ts            ← Zustand: 语言偏好 (zh/en)
├── types/
│   ├── hardware.ts
│   ├── recommendation.ts
│   └── model.ts
└── lib/
    ├── i18n/
    │   ├── zh.json                 ← 中文翻译字典
    │   └── en.json                 ← 英文翻译字典
    └── utils.ts
```

---

## 3. API 契约

### 3.1 统一响应格式

```json
// 成功
{ "success": true, "data": { ... } }

// 失败
{ "success": false, "error": { "message": "..." } }
```

### 3.2 端点定义

#### POST /api/v1/recommend — 核心推荐

- **描述**：提交硬件配置，返回推荐模型列表和升级建议
- **超时**：500ms 内响应

**Request：**
```json
{
  "hardware": {
    "gpu_name": "NVIDIA GeForce RTX 3060",
    "ram_gb": 32,
    "cpu_cores": 16,
    "os": "Windows"
  }
}
```

**Response：**
```json
{
  "success": true,
  "data": {
    "hardware": {
      "gpu_name": "NVIDIA GeForce RTX 3060",
      "vram_gb": 12,
      "gpu_tier": "mid",
      "ram_gb": 32,
      "cpu_cores": 16,
      "os": "Windows"
    },
    "recommendations": [
      {
        "model_id": "qwen2.5-7b-q4",
        "rank": 1,
        "scores": {
          "quality": 85,
          "speed": 72,
          "compatibility": 88,
          "context": 60,
          "total": 78.5
        },
        "estimated_vram_gb": 5.2,
        "estimated_tokens_per_sec": 45,    // Decode 阶段 TPS（持续生成速度）
        "runnable": true
      }
    ],
    "upgrade_suggestions": [
      {
        "current_gpu": "NVIDIA GeForce RTX 3060",
        "suggested_gpu": "NVIDIA GeForce RTX 5070",
        "improvement": {
          "vram_delta_gb": 4,
          "speed_boost_pct": 40,
          "unlocks_models": ["llama3.1-70b-q4", "qwen2.5-32b-q4"]
        }
      }
    ]
  }
}
```

#### GET /api/v1/models — 模型列表

- **描述**：分页获取所有模型
- **查询参数**：`page` (默认 1), `size` (默认 20), `family` (可选筛选)

#### GET /api/v1/models/{id} — 模型详情

- **描述**：获取单个模型的完整信息

### 3.3 错误码

| 状态码 | 含义 | 场景 |
|--------|------|------|
| 200 | 成功 | 正常返回 |
| 400 | 请求参数错误 | GPU 名称格式错误、缺少必填字段 |
| 404 | 资源不存在 | GPU 不在数据库、模型 ID 无效 |
| 422 | 校验失败 | Pydantic 校验不通过 |
| 500 | 服务器错误 | 未预期异常 |

---

## 4. 评分算法设计

### 4.1 综合评分公式

```
Score_total = 0.40 × Q + 0.25 × S + 0.20 × C + 0.15 × X
```

- Q = 质量分 (Quality)
- S = 速度分 (Speed)
- C = 适配分 (Compatibility)
- X = 上下文分 (Context)
- 范围：0–100
- 不可运行模型（compatibility = 0）直接过滤

### 4.2 VRAM 估算

**简化公式（快速筛选阶段）：**
```
VRAM_GB = P × (Q_bits / 8) × 1.2
```
- P = 参数量（十亿）
- Q_bits = 量化位宽（4 / 8 / 16）
- 1.2 = KV Cache + 框架开销系数

**精确公式（评分计算阶段，来源：Jinghong Chen）：**
```
VRAM = N × 2 + 2 × h × L × b × s × 2
```
- N = 总参数量 | h = 隐藏维度 | L = 层数
- b = batch size (默认=1) | s = 上下文长度
- 全部 16-bit 精度（2 bytes）

### 4.3 推理速度估算

**来源：Jinghong Chen 博客**

```
Prefill Compute = 2 × N × b × s
Decode Compute  = 2 × N × b × 1

TTFT = Prefill_Compute / GPU_FLOPs + (2 × N) / GPU_BW
TPOT = Decode_Compute  / GPU_FLOPs + (2 × N) / GPU_BW

TPS ≈ 1 / TPOT
```

### 4.4 子分计算规则

**质量分 (40%)：**
```
score_quality = model.quality_score  ← 直接从数据库读取（预存基准分）
```

**速度分 (25%)：**
```
score_speed = min(100, (estimated_tps / 20) × 100)
```
- 目标 TPS = 20（阅读速度阈值）
- TPS ≥ 20 → 满分 100

**适配分 (20%)：**
```
headroom = (vram_available - vram_required) / vram_required
score_compatibility = clamp(headroom / 0.5 × 100, 0, 100)
```
- headroom ≥ 50% → 满分
- headroom < 0 → 0 分（不可运行）

**上下文分 (15%)：**
```
score_context = min(100, (model_context / 131072) × 100)
```
- 以 128K 为满分基准
- 硬件显存不足以支撑上下文长度时，按比例降低

---

## 5. 数据模型

### 5.1 GPU Spec

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | GPU 型号名称 |
| vendor | string | 厂商 (nvidia / amd / apple / intel) |
| vram_gb | float | 显存容量 |
| benchmark_score | int | PassMark G3D 基准分 |
| flops_tflops | float | FP16 TFLOPS |
| memory_bandwidth_gb_s | float | 显存带宽 GB/s |
| tier | enum | entry / mid / high / enthusiast |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 5.2 Model Spec

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| family | string | 模型家族 (Qwen / Llama / Gemma 等) |
| name | string | 完整名称 |
| parameter_count_b | float | 参数量 (十亿) |
| quantization | string | 量化格式 (Q4_K_M / Q8_0 / FP16 等) |
| quantization_bits | int | 量化位宽 |
| min_vram_gb | float | 最低显存 |
| recommended_vram_gb | float | 推荐显存 |
| context_length | int | 最大上下文长度 |
| hidden_dim | int | 隐藏维度 |
| num_layers | int | Transformer 层数 |
| quality_score | int | 预存质量分 (0-100) |
| download_url | string | 下载链接 |
| huggingface_repo | string | HuggingFace 仓库 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 5.3 GPU 等级划分

| 等级 | VRAM | 代表 GPU | 推荐参数量 |
|------|------|----------|-----------|
| entry | 4–6 GB | GTX 1650, MX450 | 1–3B |
| mid | 8–12 GB | RTX 3060, RTX 4060 | 7–8B |
| high | 16–24 GB | RTX 4090, RTX 5080 | 13–32B |
| enthusiast | 32+ GB | A100, M4 Max 128G | 70B+ |

### 5.4 首批模型覆盖（50 个）

| 家族 | 规格 | 数量 |
|------|------|------|
| Qwen3 | 0.6B / 1.8B / 4B / 8B / 14B / 32B × Q4/Q8 | ~12 |
| Llama 3.1 | 8B / 70B × Q4/Q8 | ~8 |
| Gemma 3 | 1B / 4B / 12B / 27B × Q4/Q8 | ~8 |
| Mistral Small | 7B / 8x7B / 8x22B × Q4 | ~6 |
| DeepSeek Distill | 1.5B / 7B / 8B / 14B / 32B × Q4/Q8 | ~10 |
| Others | Phi-4, Command R, etc. | ~6 |

---

## 6. Repository 抽象层

采用 Python Protocol 实现可插拔数据源：

```python
class IModelRepository(Protocol):
    def get_all(self, page: int, size: int, family: str | None) -> PaginatedResult[Model]: ...
    def get_by_id(self, model_id: str) -> Model | None: ...
    def get_by_family(self, family: str) -> list[Model]: ...

class IGpuRepository(Protocol):
    def get_all(self) -> list[GpuSpec]: ...
    def get_by_name(self, name: str) -> GpuSpec | None: ...
    def find_closest_match(self, gpu_name: str) -> GpuSpec | None: ...
```

- **Phase 1–3**：`JsonModelRepository` + `JsonGpuRepository`（读取 JSON 文件）
- **Phase 4+**：替换为 `SqlModelRepository` + `SqlGpuRepository`，接口不变

---

## 7. 前端页面设计

> **设计决策：单页面应用 + 中英文切换**

### 7.1 页面结构（单页面 `/`）

```
┌──────────────────────────────────────┐
│  Header: Logo · LanguageSwitcher     │
├──────────────────────────────────────┤
│  Hero Section                        │
│  「Can I Run This LLM?」             │
│  副标题 · 「Analyze My PC」按钮      │
├──────────────────────────────────────┤
│  (检测完成后显示)                    │
│  HardwareCard: GPU / VRAM / RAM / OS │
├──────────────────────────────────────┤
│  RecommendationList (Top 10)         │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Model │ │Model │ │Model │  ...    │
│  │Card  │ │Card  │ │Card  │         │
│  └──────┘ └──────┘ └──────┘        │
├──────────────────────────────────────┤
│  UpgradeSuggestions                  │
├──────────────────────────────────────┤
│  Footer                              │
└──────────────────────────────────────┘

点击 ModelCard → ModelDetailModal (弹窗展示完整信息)
```

### 7.2 交互流程

1. 用户进入页面 → 看到 Hero 区域
2. 点击「Analyze My PC」→ 浏览器检测硬件
3. 检测完成 → Hero 收起，页面平滑滚动到结果区域
4. 结果区域展示：硬件信息 + 推荐列表 + 升级建议
5. 点击任意模型卡片 → 弹出 ModelDetailModal
6. 关闭弹窗 → 回到结果区域

### 7.3 各组件职责

| 组件 | 职责 |
|------|------|
| `HeroSection` | 标题、副标题、检测按钮、检测中 Loading 态 |
| `HardwareCard` | GPU/VRAM/RAM/CPU/OS 信息展示 |
| `RecommendationList` | Top 10 排序列表，含排序切换（综合/质量/速度） |
| `ModelCard` | 模型名称、参数量、评分环形图、TPS、显存、可运行标记 |
| `ModelDetailModal` | 完整参数、下载链接、HuggingFace 链接 |
| `UpgradeSuggestions` | GPU 升级建议、预期提升 |
| `LanguageSwitcher` | 中/英切换，Zustand 持久化语言偏好 |

### 7.4 全局要求
- Dark Mode 支持（TailwindCSS dark class）
- Mobile First / Responsive（单列 → 双列 → 多列网格）
- Loading / Error / Empty 三态覆盖，禁止白屏
- 中英文切换即时生效，无页面刷新

### 7.5 国际化方案

轻量字典方案（不引入第三方 i18n 库）：

```typescript
// lib/i18n/zh.json
{
  "hero.title": "Can I Run This LLM?",
  "hero.subtitle": "自动分析你的电脑，推荐最适合运行的 LLM",
  "hero.button": "检测我的电脑",
  "hero.detecting": "正在检测硬件...",
  "hardware.gpu": "显卡",
  "hardware.vram": "显存",
  "hardware.ram": "内存",
  "hardware.cpu": "CPU 线程",
  "recommendation.title": "推荐模型",
  "recommendation.runnable": "可运行",
  "recommendation.not_runnable": "显存不足",
  "upgrade.title": "升级建议",
  ...
}
```

```typescript
// hooks/use-translation.ts
// 从 Zustand locale-store 读取当前语言
// 从对应 JSON 字典查找翻译 key
// 用法: const t = useTranslation(); t("hero.title")
```



---

## 8. 开发阶段

| 阶段 | 焦点 | 核心交付 |
|------|------|----------|
| Phase 1 | 脚手架 + 数据 | 项目骨架、Mock 数据、类型定义、Repository |
| Phase 2 | 推荐引擎 | GPU Mapper、评分算法、单元测试（覆盖率 ≥ 80%） |
| Phase 3 | 全栈联调 | API 路由、前端三页面、端到端流程 |
| Phase 4 | 部署 + 文档 | Docker、补测试、README |

每个阶段完成后停止，等待确认后再进入下一阶段。

---

## 9. 安全规范

- 所有敏感配置通过 `.env` 注入，不硬编码
- 提供 `.env.example` 模板
- 禁止暴露数据库密码、API Key、Secret
- CORS 白名单控制
- 输入校验（Pydantic），防止注入

## 10. 测试规范

- Backend: pytest，覆盖率 ≥ 80%
- Frontend: vitest
- 必须覆盖：GPU 映射、模型筛选、评分逻辑、排序逻辑
- 每个 Phase 完成后运行测试，全部通过才进入下一阶段

---

## 11. 参考来源

- [Jinghong Chen — Estimate LLM inference speed and VRAM usage](https://www.jinghong-chen.net/estimate-vram-usage-in-llm-inference/)
- [deep-research-report.md](../deep-research-report.md) — 系统架构与评分框架参考
- [AlexsJones/llmfit](https://github.com/AlexsJones/llmfit) — 原始参考项目
