# LLMFit Web — 全阶段归档报告

> **归档日期：** 2026-06-04
> **覆盖范围：** Phase 1 ~ Phase 6（含美化增强方案）
> **Git 分支：** master（31 commits）
> **项目版本：** MVP v1.0

---

## 一、项目总览

| 指标 | 数值 |
|------|------|
| 后端源文件 | 41 个 Python 文件 |
| 后端测试文件 | 22 个 pytest 文件 |
| 前端源文件 | 80 个 TypeScript 文件 |
| 前端组件数 | 38 个 |
| 页面路由数 | 13 个页面 |
| i18n 翻译键 | 176 个（zh + en 完全对齐） |
| Git 提交数 | 31 个 commit |
| TypeScript 错误 | **0** |
| 后端测试通过 | **160 个**（全部通过） |

---

## 二、各阶段完成详情

### Phase 1：基础设施 — 脚手架 + 数据层

**完成日期：** 2026-05-31
**Git 范围：** `0ac25e1` ~ `7a53894`

#### 新建文件

| 文件 | 说明 |
|------|------|
| `backend/src/models/` | SQLAlchemy 数据模型 |
| `backend/src/schemas/hardware.py` | HardwareInput / HardwareInfo Pydantic 校验 |
| `backend/src/schemas/recommendation.py` | ModelScores / RecommendedModel / UpgradeSuggestion 等 |
| `backend/src/repositories/interfaces.py` | IGpuRepository / IModelRepository Protocol 接口 |
| `backend/src/repositories/json_gpu_repository.py` | JSON 文件 GPU 数据仓库（MVP mock） |
| `backend/src/repositories/json_model_repository.py` | JSON 文件模型数据仓库（MVP mock） |
| `backend/src/utils/vram.py` | VRAM 估算、TPS 预估工具函数 |
| `backend/tests/test_schemas/` | Schema 校验测试 |
| `backend/tests/test_repositories/` | Repository 测试 |
| `frontend/src/types/` | TypeScript 类型定义（与 backend schema 对齐） |
| `frontend/src/lib/i18n/` | i18n 基础设施（zh.json / en.json / useTranslation） |
| `frontend/src/stores/` | Zustand stores（locale / hardware / theme） |
| `frontend/src/hooks/` | useHardwareDetection / useRecommendations |
| `frontend/src/app/layout.tsx` | 根布局（Navbar + Footer + 主题防闪脚本） |
| `frontend/src/app/page.tsx` | 英雄页 + CTA + 检测工具 |
| `frontend/src/components/ui/` | Shadcn UI 组件库（Button, Card, Badge, Dialog） |

#### 关键决策
- 数据层采用 **Repository Pattern**（Protocol 接口），方便未来从 JSON mock 迁移到 PostgreSQL
- 主键统一使用 **UUID**，禁止自增整数 ID
- 前端状态管理：TanStack Query（API 数据）+ Zustand（本地状态），禁止 Redux

---

### Phase 2：推荐引擎

**完成日期：** 2026-05-31
**Git 范围：** `3e3c27e` ~ `05be753`

#### 新建文件

| 文件 | 说明 |
|------|------|
| `backend/src/services/gpu_mapper.py` | GPU 型号名 → 完整规格映射（模糊匹配） |
| `backend/src/services/scoring/quality.py` | 质量评分（40% 权重） |
| `backend/src/services/scoring/speed.py` | 速度评分（25% 权重） |
| `backend/src/services/scoring/compatibility.py` | 适配度评分（20% 权重） |
| `backend/src/services/scoring/context.py` | 上下文评分（15% 权重） |
| `backend/src/services/scoring/composite.py` | 加权综合评分：`0.40×质量 + 0.25×速度 + 0.20×适配度 + 0.15×上下文` |
| `backend/src/services/recommendation_engine.py` | 推荐管线编排（Map → Filter → Score → Sort → Upgrade） |
| `backend/tests/test_services/test_gpu_mapper.py` | GPU 映射测试 |
| `backend/tests/test_services/test_scoring/` | 4 维度评分全覆盖测试 |
| `backend/tests/test_services/test_vram.py` | VRAM/TPS 工具测试 |

#### 评分系统架构

```
GPU 型号 → GPU Mapper（模糊匹配） → GPU 规格 → VRAM → 模型筛选
                                                       ↓
4 维独立评分 → 质量(40%) + 速度(25%) + 适配度(20%) + 上下文(15%)
                                                       ↓
                                              加权综合分(0-100)
                                                       ↓
                                                Top 10 排序输出
```

#### 关键决策
- 评分算法独立封装在 `backend/src/services/scoring/`，禁止在 Controller 或 Repository 中写评分逻辑
- GPU 规格数据通过 `gpu_mapper.py` 统一映射，禁止在业务代码中硬编码显存

---

### Phase 3：全栈集成 — API 层 + 前端对接

**完成日期：** 2026-05-31 ~ 2026-06-02
**Git 范围：** `b3dfc5b` ~ `fef6d38`

#### 新建/修改文件

| 文件 | 说明 |
|------|------|
| `backend/src/api/models.py` | `/api/v1/models` — 模型列表（支持 sort_by / order / 分页） |
| `backend/src/api/gpus.py` | `/api/v1/gpus` — GPU 列表（支持 sort_by / order） |
| `backend/src/api/recommend.py` | `/api/v1/recommend` — 推荐管线入口 |
| `backend/src/api/news.py` | `/api/v1/news` — 资讯列表 + 详情 |
| `frontend/src/services/api-client.ts` | 统一 API 客户端（错误处理 / 超时 / 类型安全） |
| `frontend/src/hooks/use-recommendations.ts` | TanStack Query hook |
| `frontend/src/components/hardware-card.tsx` | 硬件配置展示卡片 |
| `frontend/src/components/model-card.tsx` | 模型推荐卡片（评分环 + 规格 + 运行状态） |
| `frontend/src/components/model-detail-modal.tsx` | 模型详情弹窗（全规格表 + 外部链接） |
| `frontend/src/components/recommendation-list.tsx` | 推荐列表（排序控件 + 空状态） |
| `frontend/src/components/results-section.tsx` | 结果区（加载态 / 错误态 / 数据态） |
| `frontend/src/components/upgrade-suggestions.tsx` | GPU 升级建议卡片 |

#### API 统一响应格式

```json
// 成功
{ "success": true, "data": { ... } }

// 失败
{ "success": false, "error": { "message": "..." } }
```

#### 关键决策
- API 层禁止包含业务逻辑，所有推荐逻辑在 `RecommendationEngine` 中处理
- 前端禁止硬编码推荐结果
- 所有查询必须支持分页

---

### Phase 4：内容页面 — 模型库 + GPU 库 + 资讯 + 法务 + 管理后台

**完成日期：** 2026-06-02 ~ 2026-06-03
**Git 范围：** `4448914` ~ `6e622fc`

#### 新建页面（8 个）

| 路由 | 文件 | 策略 |
|------|------|------|
| `/models` | `app/models/page.tsx` | ISR 30min③ 模型卡片网格 |
| `/models/[slug]` | `app/models/[slug]/page.tsx` | SSR 动态 metadata |
| `/gpus` | `app/gpus/page.tsx` | ISR 30min④ GPU 规格网格 |
| `/gpus/[slug]` | `app/gpus/[slug]/page.tsx` | SSR 动态 metadata |
| `/news` | `app/news/page.tsx` | 客户端分类筛选 + 分页 |
| `/news/[slug]` | `app/news/[slug]/page.tsx` | SSR Article JSON-LD |
| `/about` | `app/about/page.tsx` | SSG 静态 |
| `/contact` | `app/contact/page.tsx` | SSG + ContactForm |
| `/privacy` | `app/privacy/page.tsx` | SSG 静态 |
| `/terms` | `app/terms/page.tsx` | SSG 静态 |
| `/admin` | `app/admin/page.tsx` | 客户端（robots: noindex） |
| `/tools/recommend` | `app/tools/recommend/page.tsx` | 客户端（需 WebGL） |

#### 新建组件（10+ 个）

| 组件 | 用途 |
|------|------|
| `breadcrumb.tsx` | 面包屑导航 + BreadcrumbList JSON-LD |
| `page-header.tsx` | 通用页面标题区 |
| `footer.tsx` | 全局底栏（4 列导航 + 版权） |
| `search-bar.tsx` | 通用搜索框 |
| `filter-bar.tsx` | 分类/标签筛选条 |
| `news-card.tsx` | 资讯文章卡片 |
| `model-card-featured.tsx` | 紧凑版模型卡片 |
| `model-card-link.tsx` | 模型列表链接卡片 |
| `gpu-card-link.tsx` | GPU 列表链接卡片 |
| `contact-form.tsx` | 联系表单（含 label 关联） |
| `markdown-renderer.tsx` | Markdown 渲染器 |
| `faq-section.tsx` | FAQ 折叠面板 + JSON-LD |
| `pros-cons-list.tsx` | 优缺点列表 |
| `internal-links.tsx` | 内部链接区块 |

---

### Phase 5：首页升级 + 工具增强

**完成日期：** 2026-06-03
**Git 范围：** `8d0b32d` ~ `ed4ec29`

#### 新建文件

| 文件 | 说明 |
|------|------|
| `home-client.tsx` | 客户端组件：QueryClientProvider + Hero + 终端动画 + 结果 |
| `featured-models-section.tsx` | 热门模型板块（ISR 30min, Top 6 by quality_score） |
| `featured-models-header.tsx` | 热门模型标题区（客户端 i18n） |
| `featured-gpus-section.tsx` | 热门 GPU 板块（3 张横向卡片, Top 3 by benchmark） |
| `home-news-section.tsx` | 最新资讯板块（3 篇文章卡片） |
| `home-cta-section.tsx` | 底部 CTA 横幅 |
| `terminal-animation.tsx` | Claude Code iOS 风格终端打字动画 |
| `token-animation.tsx` | Token 生成动画（playground 演示用） |
| `scoring-explanation.tsx` | 可展开评分公式面板（4 维度 + 颜色条 + 公式框） |
| `tradeoff-bar.tsx` | 四维迷你进度条组件 |
| `gpu-selector.tsx` | GPU 手动选择器（搜索 + 下拉） |
| `models/page.tsx` | 模型库列表页（ISR） |
| `gpus/page.tsx` | GPU 库列表页（ISR） |

#### 修改文件

| 文件 | 变更 |
|------|------|
| `app/page.tsx` | 从 `"use client"` 重构为服务端组件，整合全部板块 |
| `hero-section.tsx` | 集成 TerminalAnimation，支持检测前后状态切换 |
| `model-card.tsx` | 新增推荐理由行 + TradeoffBars 四维权衡条 |
| `recommendation-list.tsx` | 新增 ScoringExplanation 可展开面板 |
| `backend/src/services/recommendation_engine.py` | 新增 `_generate_reason()` 函数 |
| `backend/src/schemas/recommendation.py` | `RecommendedModel` 新增 `reason` 字段 |
| `backend/src/api/models.py` | 新增 `sort_by` + `order` 查询参数 |
| `backend/src/api/gpus.py` | 新增 `sort_by` + `order` 查询参数 |
| `lib/i18n/en.json` | +24 键 |
| `lib/i18n/zh.json` | +24 键 |

#### 首页最终布局

```
🧭 Navbar (sticky)
─────────────────────
🧭 Hero + CTA + 终端动画
📊 检测结果（条件显示）
🔥 热门模型 × 6（服务端 ISR）
🖥️ 热门 GPU × 3（客户端）
📰 最新文章 × 3（客户端）
🚀 底部 CTA
─────────────────────
📄 Footer（4 列导航）
```

#### 推荐理由优先级

```
1. vram_tight_fit     — 显存紧张警告（最高优先）
2. top_quality        — 突出质量优势
3. excellent_speed    — 突出速度优势
4. perfect_match      — 突出适配优势
5. great_context      — 突出上下文优势
6. vram_headroom_high — 显存充裕
7. balanced_choice    — 综合均衡（fallback）
```

---

### Phase 6：SEO 打磨 + i18n 完善

**完成日期：** 2026-06-04
**状态：** ✅ 完成

#### 新建文件（5 个）

| 文件 | 说明 |
|------|------|
| `app/sitemap.ts` | Next.js 动态 sitemap — 9 个核心页面 |
| `app/robots.ts` | robots.txt — allow `/`，disallow `/admin` |
| `html-lang-sync.tsx` | `"use client"` 组件，同步 `<html lang>` 到 locale |
| `featured-models-header.tsx` | 客户端 i18n 标题组件（保持 ISR） |

#### 修改文件（20 个）

**SEO 基础设施：**

| 文件 | 变更 |
|------|------|
| `app/layout.tsx` | `title.template` + `openGraph.siteName/url/locale` + JSON-LD (WebSite + Organization) |
| `lib/seo.ts` | 简化 `constructMetadata`，去掉手动拼接 `— SITE_NAME` |
| `app/page.tsx` | 添加 `HOME_META` 导出 |
| `app/models/page.tsx` | 内联 metadata → `MODELS_META`（含 OG/twitter/canonical） |
| `app/gpus/page.tsx` | 内联 metadata → `GPUS_META`（含 OG/twitter/canonical） |

**i18n 扩张（145 → 176 键）：**

| 分类 | 新增键数 | 键示例 |
|------|---------|--------|
| 导航 & 全局 | 5 | `nav.menu_open`, `nav.menu_close`, `lang.*` |
| 通用组件 | 12 | `common.search`, `common.all`, `common.gb_vram`, `common.benchmark` 等 |
| 空状态 / 错误 | 5 | `common.empty_*`, `error.not_found_*` |
| SEO | 5 | `seo.models_*`, `seo.gpus_*`, `seo.home_*` |
| 日期 | 1 | `news.published_date` |
| A11y | 5 | `a11y.footer_*`, `a11y.breadcrumb`, `a11y.skip_to_content` |

**组件 i18n 改造（13 个组件）：**

| 组件 | 改造内容 |
|------|----------|
| `breadcrumb.tsx` | `"Home"` → `t("breadcrumb.home")` |
| `navbar.tsx` | `aria-label` → `t("nav.menu_*")` + `aria-current="page"` |
| `language-switcher.tsx` | 自身标签全部 → `t("lang.*")` |
| `home-cta-section.tsx` | 全部中文 → `t("home.cta_*")` |
| `featured-models-section.tsx` | 拆分为 server (fetch) + client (i18n header) |
| `featured-gpus-section.tsx` | TIER_LABELS / 标题 / 标签 → `t()` |
| `home-news-section.tsx` | 标题 / 按钮 → `t("home.*")` |
| `model-card.tsx` | REASON_LABELS 硬编码 → `t("reason.*")` |
| `scoring-explanation.tsx` | 全部文本 → `t("scoring.*")` |
| `tradeoff-bar.tsx` | 标签 → `t("tradeoff.*")` |
| `filter-bar.tsx` | `"All"` → `t("common.all")` |
| `news-card.tsx` | CATEGORY_LABELS + "Read More" → `t()` + `<time>` |
| `not-found.tsx` | 全部硬编码 → `t("error.not_found_*")` |

**语义 HTML & A11y 修复：**

| 文件 | 变更 |
|------|------|
| `navbar.tsx` | 桌面 + 移动端链接添加 `aria-current="page"` |
| `search-bar.tsx` | `<input>` 添加 `aria-label` |
| `news-card.tsx` | `<span>` 日期 → `<time datetime>` |
| `news/[slug]/page.tsx` | 添加独立 `<time dateTime>` 元素 |
| `footer.tsx` | 链接列 `<div>` → `<nav aria-label>` |

**locale 增强：**

| 文件 | 变更 |
|------|------|
| `locale-store.ts` | 添加 Zustand `persist` middleware → localStorage 持久化 |

---

## 三、架构全景图

### Backend

```
backend/src/
├── api/                    # FastAPI 路由层
│   ├── models.py           # /api/v1/models
│   ├── gpus.py             # /api/v1/gpus
│   ├── recommend.py        # /api/v1/recommend
│   └── news.py             # /api/v1/news
├── services/               # 业务逻辑层
│   ├── recommendation_engine.py  # 推荐管线
│   ├── gpu_mapper.py       # GPU 型号映射
│   └── scoring/            # 评分算法
│       ├── quality.py      # 质量 40%
│       ├── speed.py        # 速度 25%
│       ├── compatibility.py # 适配 20%
│       ├── context.py      # 上下文 15%
│       └── composite.py   # 加权综合
├── repositories/           # 数据访问层
│   ├── interfaces.py       # Protocol 接口
│   ├── json_gpu_repository.py
│   └── json_model_repository.py
├── models/                 # SQLAlchemy ORM
├── schemas/                # Pydantic 校验
└── core/                   # 配置 / 中间件
```

### Frontend

```
frontend/src/
├── app/                    # Next.js App Router (13 个页面)
│   ├── page.tsx            # 首页
│   ├── models/             # 模型库
│   ├── gpus/               # GPU 库
│   ├── news/               # 资讯
│   ├── tools/recommend/    # 推荐工具
│   ├── about|contact|privacy|terms/  # 法务
│   ├── admin/              # 管理后台
│   ├── layout.tsx          # 根布局
│   ├── sitemap.ts          # sitemap.xml
│   └── robots.ts           # robots.txt
├── components/             # 38 个组件
│   ├── home-client.tsx     # 首页客户端 wrapper
│   ├── home-cta-section.tsx
│   ├── featured-models-section.tsx
│   ├── featured-gpus-section.tsx
│   ├── home-news-section.tsx
│   ├── hero-section.tsx
│   ├── terminal-animation.tsx
│   ├── hardware-card.tsx
│   ├── model-card.tsx
│   ├── recommendation-list.tsx
│   ├── scoring-explanation.tsx
│   ├── tradeoff-bar.tsx
│   ├── upgrade-suggestions.tsx
│   ├── breadcrumb.tsx
│   ├── navbar.tsx
│   ├── footer.tsx
│   ├── search-bar.tsx
│   ├── filter-bar.tsx
│   ├── news-card.tsx
│   ├── html-lang-sync.tsx
│   ├── language-switcher.tsx
│   ├── theme-toggle.tsx
│   └── ui/                 # Shadcn UI primitives
├── hooks/                  # useTranslation, useHardwareDetection, useRecommendations
├── stores/                 # Zustand: locale, hardware, theme, recommendation
├── services/               # api-client.ts
├── lib/                    # seo.ts, i18n/*.json, utils.ts
└── types/                  # TypeScript 类型定义
```

---

## 四、质量指标

| 指标 | 目标 | 实际 |
|------|------|------|
| TypeScript 错误 | 0 | **0** |
| 后端测试通过率 | 100% | **160/160 通过** |
| i18n 键覆盖率 | 300+ 键 | **176 键**（持续增长中） |
| i18n 硬编码文本 | 0 | **0**（全部改造） |
| 测试覆盖率 | ≥80% | 核心模块已覆盖 |
| 组件职责 | ≤300 行/文件 | 全部符合 |
| Lighthouse SEO | ≥90 | 待 CDN 部署后实测 |

---

## 五、部署架构

```
用户浏览器
    ↕
Vercel / 自建 (Next.js 16 SSR + 静态导出)
    ↕
Railway / 自建 (FastAPI + Python 3.12)
    ↕
Supabase / 自建 (PostgreSQL)
```

---

## 六、路线图完成情况

```
Phase 1: 基础设施（路由 + 布局）              ████████████ ✅ 完成
Phase 2: 推荐引擎                             ████████████ ✅ 完成
Phase 3: 全栈集成                             ████████████ ✅ 完成
Phase 4: 内容页面（模型/GPU/资讯/法务）        ████████████ ✅ 完成
Phase 5: 首页升级 + 工具增强                   ████████████ ✅ 完成
Phase 6: SEO 打磨 + i18n                      ████████████ ✅ 完成
────────────────────────────────────────────────────────────────
MVP v1.0                                      ████████████ 100%
```

---

## 七、后续建议

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P0 | CDN 部署验证 | 正式部署后测试 sitemap/robots/OG 标签 |
| P0 | Lighthouse 实测 | SEO + Performance + A11y 三指标 |
| P1 | JSON → PostgreSQL 迁移 | Production 数据持久化 |
| P1 | 动态 sitemap 增强 | 从 API 获取 models/gpus/news 动态 URL |
| P2 | OG Image 生成 | 基于 `opengraph-image.tsx` 生成社交分享图 |
| P2 | Google AdSense 申请 | 内容量达到过审门槛后提交 |
| P3 | 用户系统 | Phase 7+（非 MVP 范围） |
| P3 | 模型推理集成 | Phase 7+（非 MVP 范围） |
