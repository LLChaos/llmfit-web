# LLMFit Web — Project v1.0 站点重构方案

> **文档版本：** 1.0
> **创建日期：** 2025-06-04
> **状态：** 已确认，Phase 1 实施中

---

## 一、项目背景与目标

LLMFit Web 是一个面向本地大模型用户的硬件适配推荐平台。当前为 MVP 阶段的单页应用（SPA）。

本次重构将网站从"单纯工具页"升级为"AI 模型选型知识平台"，目标是：

- 提高 Google AdSense 过审概率
- 建立可被搜索引擎收录的内容体系
- 打造长期运营的内容基础设施
- 保持原有硬件检测 + 模型推荐工具功能不变

---

## 二、技术策略

### 2.1 重构方式：增量构建（非推倒重来）

| 层级 | 策略 | 说明 |
|------|------|------|
| **Backend 全部** | 零改动保留 | API、推荐引擎、评分系统、GPU Mapper、Repository、Schema |
| **Frontend Stores** | 全部保留 | hardware-store、theme-store、locale-store、recommendation-store |
| **Frontend Hooks** | 全部保留 | use-hardware-detection、use-recommendations、use-translation |
| **UI 原语** | 全部保留 | Button、Card、Badge、Dialog |
| **动画组件** | 全部保留 | TerminalAnimation、TokenAnimation |
| **CSS 主题** | 全部保留 | globals.css + CSS 变量 + 渐淡网格背景 |
| **API Client** | 全部保留 | api-client.ts |
| **i18n 系统** | 加载机制保留 | 新增 key 约 200 个 |
| **Navbar** | 小改 | 加导航链接入口 |
| **layout.tsx** | 小改 | 加 Footer |
| **HeroSection** | 小改 | 支持 variant="full" 和 "compact" |

### 2.2 内容管理：数据库驱动

采用 **PostgreSQL + FastAPI + Next.js SSR** 方案：

```
你打开浏览器 → 登录 /admin → 写文章 → 点发布 → 用户立即看到
```

- 博客文章和学习教程存在 PostgreSQL 的 `news_posts` 表中
- Next.js 通过 SSR 在请求时从 FastAPI 取数据渲染
- 无需 git push、无需重建、无需重启服务
- 新增文章：INSERT 一行数据即上线

### 2.3 管理后台认证：环境变量密码 + 多层防御

| 防御层 | 措施 |
|--------|------|
| 第 1 层 | 密码存储在服务器环境变量（不在代码/数据库/Web目录） |
| 第 2 层 | 登录页面仅是一张表单，无数据库交互 |
| 第 3 层 | FastAPI API Route 或 Next.js Server Component 服务端校验 |
| 第 4 层 | 同一 IP 5 次失败后封禁 15 分钟（速率限制） |
| 第 5 层 | SQLAlchemy ORM 参数化查询（防 SQL 注入） |
| 第 6 层 | Cookie HttpOnly + Secure + SameSite=Strict（防劫持） |

---

## 三、站点地图（最终版）

```
/                          首页（产品 + 内容组合）
├── /tools/recommend       模型推荐工具页
├── /models                模型库列表页
│   └── /models/[slug]     单个模型详情页（47 个）
├── /gpus                  GPU 数据库列表页
│   └── /gpus/[slug]       单个 GPU 详情页（26 个）
├── /news                  最新资讯（行业动态 + 站点更新 + 教程指南）
│   └── /news/[slug]       单篇文章详情
├── /about                 关于我们
├── /contact               联系我们
├── /privacy               隐私政策
├── /terms                 服务条款
├── /sitemap.xml           站点地图
└── /robots.txt            爬虫配置

博客 → Navbar / Footer 中外链到外部博客 URL（占位链接，后期配置）
```

---

## 四、页面内容模块规划

### 4.1 首页 `/`

**定位：** 产品 + 内容入口组合页

**模块布局（从上到下）：**

1. **Hero Section** — CTA 按钮 + 终端动画 + 产品定位 slogan
2. **三列价值主张** — 硬件检测 → 智能匹配 → 一键部署
3. **热门模型卡片**（6 个，按 quality_score 精选）— 可点击进详情
4. **热门 GPU 卡片**（6 个，按 tier 精选）— 可点击进详情
5. **最新资讯入口** — 3 篇最新文章卡片
6. **底部 CTA** — 再次引导使用推荐工具

### 4.2 模型推荐工具页 `/tools/recommend`

保留现有核心工具功能，增强解释层：

- HeroSection 简化版（小标题 + CTA）
- HardwareCard（保留，不做改动）
- RecommendationList（保留 + 新增推荐理由展开面板）
- **新增：推荐理由面板** — 每个模型展开后显示"为什么推荐"
- **新增：权衡说明区块** — VRAM / 速度 / 上下文三者的取舍关系
- **新增：排序原因提示** — 当前排序依据说明

### 4.3 模型库列表页 `/models`

- 搜索框（按名称/家族搜索）
- 家族筛选标签（Qwen / Llama / Gemma / Mistral / DeepSeek / Phi）
- 参数量筛选（1B- / 1B~8B / 8B~32B / 32B+）
- 量化方式筛选
- 分页卡片列表（每页 12 个）
- 每个卡片：模型名 + 家族 + 参数量 + VRAM 需求 + quality_score + 上下文长度

### 4.4 模型详情页 `/models/[slug]`

SEO 核心页面，每页包含：

1. **面包屑** — 首页 > 模型库 > 模型名
2. **标题区** — 模型名称 + 家族 badge + 参数量 + 量化方式
3. **规格参数网格** — VRAM、上下文、hidden_dim、layers、quality_score
4. **原创描述**（~300 字）— 模型定位、擅长领域、适用场景
5. **优缺点列表** — 从参数推导的客观评价
6. **推荐 GPU 列表** — 哪些 GPU 可以流畅运行
7. **同家族模型对比表** — 不同量化方案的 VRAM/速度对比
8. **FAQ** — 3-5 个常见问题
9. **内部链接** — 相关模型、推荐 GPU、相关教程

### 4.5 GPU 库列表页 `/gpus`

- 搜索框
- 供应商筛选（NVIDIA / AMD / Apple / Intel）
- 等级筛选（entry / mid / high / enthusiast）
- VRAM 范围筛选
- 分页卡片列表（每页 12 个）
- 每个卡片：GPU 名 + 供应商 + VRAM + tier badge + benchmark score

### 4.6 GPU 详情页 `/gpus/[slug]`

1. **面包屑** — 首页 > GPU 库 > GPU 名
2. **标题区** — GPU 名称 + 供应商 + tier badge
3. **规格参数网格** — VRAM、benchmark、TFLOPS、带宽
4. **原创描述**（~300 字）— GPU 定位、适合场景
5. **可运行模型列表** — 此 GPU 能跑的模型
6. **同等级 GPU 对比表**
7. **升级建议** — 升级到更高等级 GPU 可解锁什么
8. **FAQ** — 3-5 个常见问题
9. **内部链接** — 相关 GPU、可运行模型

### 4.7 最新资讯 `/news`

混合定位，用分类标签区分：

| 分类 | 示例标题 |
|------|---------|
| 🏷️ 行业动态 | "Meta 发布 Llama 4，本地部署门槛再降低" |
| 🏷️ 站点更新 | "LLMFit 新增 12 款 GPU 数据，支持 RTX 50 系列" |
| 🏷️ 教程指南 | "Ollama 入门：一行命令跑起本地大模型" |

- 列表页：分页 + 分类筛选
- 详情页：面包屑 + 标题 + 日期 + 分类标签 + 正文 + 相关文章

### 4.8 法务与合规页面

| 页面 | 内容要求 |
|------|---------|
| `/about` | 项目定位、愿景、数据来源说明、推荐算法简介 |
| `/contact` | 联系表单（前端 + mailto fallback）、反馈渠道 |
| `/privacy` | 数据收集说明、Cookie 说明、第三方服务、用户权利 |
| `/terms` | 服务描述、免责声明、知识产权、终止条款 |

---

## 五、组件清单

### 新增布局组件

| 组件 | 用途 |
|------|------|
| `Footer` | 全局底栏（导航链接 + 版权 + 社交媒体占位） |
| `Breadcrumb` | 面包屑导航 + JSON-LD 结构化数据 |
| `PageHeader` | 通用页面标题区（标题 + 描述 + 面包屑） |
| `TableOfContents` | 文章目录导航（从 markdown heading 自动生成） |

### 新增功能组件

| 组件 | 用途 |
|------|------|
| `ModelGrid` / `ModelCard` | 模型卡片网格（模型库 + 首页复用） |
| `GpuGrid` / `GpuCard` | GPU 卡片网格（GPU 库 + 首页复用） |
| `NewsCard` | 资讯文章卡片 |
| `ModelSpecTable` | 模型规格参数表（详情页） |
| `GpuSpecTable` | GPU 规格参数表（详情页） |
| `FAQSection` | FAQ 折叠面板（accordion） |
| `ProsConsList` | 优缺点列表 |
| `SearchBar` | 通用搜索栏 |
| `FilterBar` | 分类/标签筛选条 |
| `InternalLinks` | 相关内部链接区块 |
| `MarkdownRenderer` | Markdown 渲染器（用于资讯和教程正文） |
| `ContactForm` | 联系表单 |

### 修改的现有组件

| 组件 | 改动 |
|------|------|
| `Navbar` | + 导航入口（模型库 / GPU 库 / 最新资讯 / 博客外链） |
| `HeroSection` | + variant="full" \| "compact" |
| `layout.tsx` | + Footer |

---

## 六、后端新增

### 新增数据库表

```sql
CREATE TABLE news_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 'news' | 'update' | 'tutorial'
    tags JSONB DEFAULT '[]',
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 新增 API

| Method | Path | 用途 |
|--------|------|------|
| `GET` | `/api/v1/news` | 文章列表（分页 + 分类筛选） |
| `GET` | `/api/v1/news/{slug}` | 文章详情 |
| `POST` | `/api/v1/admin/news` | 发布文章（需认证） |
| `PUT` | `/api/v1/admin/news/{id}` | 编辑文章（需认证） |

---

## 七、Next.js 路由文件结构

```
frontend/src/app/
├── layout.tsx                      # 根布局（修改：+Footer）
├── page.tsx                        # 首页（修改：改为新首页内容）
├── globals.css                     # 不变
├── not-found.tsx                   # 404 页面（新增）
├── sitemap.ts                      # sitemap.xml（新增）
├── robots.ts                       # robots.txt（新增）
├── tools/
│   └── recommend/
│       └── page.tsx                # 推荐工具页（迁移旧 page.tsx）
├── models/
│   ├── page.tsx                    # 模型库列表（新增）
│   └── [slug]/
│       └── page.tsx                # 模型详情 SSG（新增）
├── gpus/
│   ├── page.tsx                    # GPU 库列表（新增）
│   └── [slug]/
│       └── page.tsx                # GPU 详情 SSG（新增）
├── news/
│   ├── page.tsx                    # 最新资讯列表页（新增）
│   └── [slug]/
│       └── page.tsx                # 资讯详情页 SSR（新增）
├── about/
│   └── page.tsx                    # 关于我们（新增）
├── contact/
│   └── page.tsx                    # 联系我们（新增）
├── privacy/
│   └── page.tsx                    # 隐私政策（新增）
├── terms/
│   └── page.tsx                    # 服务条款（新增）
└── admin/
    ├── page.tsx                    # 管理后台登录（新增）
    └── layout.tsx                  # /admin 布局（新增）
```

---

## 八、实施计划（6 个 Phase）

### Phase 1：基础设施（路由 + 布局）
- [ ] 建立新 App Router 文件结构（创建所有目录和占位文件）
- [ ] 新增 Footer 组件
- [ ] 修改 Navbar（多级导航链接）
- [ ] 新增 Breadcrumb 组件
- [ ] 新增 PageHeader 组件
- [ ] 新增 404 页面
- [ ] 修改 layout.tsx（引入 Footer）
- [ ] 新增全局 SEO metadata 工具函数

**文件数：** 8 新 + 3 改

### Phase 2：法务与合规页面
- [ ] 关于我们页面 `/about`
- [ ] 联系我们页面 `/contact` + ContactForm 组件
- [ ] 隐私政策页面 `/privacy`
- [ ] 服务条款页面 `/terms`

**文件数：** 4 新 + 1 新组件

### Phase 3：模型库 + GPU 库
- [ ] 后端：可选新增 SSR 辅助 API（如需）
- [ ] 模型库列表页 `/models` + SearchBar + FilterBar
- [ ] 模型详情页 `/models/[slug]`（SSG + 原创描述生成）
- [ ] GPU 库列表页 `/gpus` + SearchBar + FilterBar
- [ ] GPU 详情页 `/gpus/[slug]`（SSG + 原创描述生成）
- [ ] 新增组件：ModelGrid、GpuGrid、ModelSpecTable、GpuSpecTable、FAQSection、ProsConsList、InternalLinks

**文件数：** 6 新 + 7 新组件

### Phase 4：最新资讯
- [ ] 后端：news_posts 数据库表 + Alembic 迁移
- [ ] 后端：NewsRepository + News API 路由（公开 + 管理）
- [ ] 后端：速率限制中间件
- [ ] 后端：种子数据脚本（5-8 篇初始文章）
- [ ] 前端：资讯列表页 `/news`
- [ ] 前端：资讯详情页 `/news/[slug]`
- [ ] 前端：MarkdownRenderer 组件
- [ ] 前端：管理后台 `/admin`（登录 + 文章编辑器）
- [ ] 前端：NewsCard 组件

**文件数：** 6 新后端 + 6 新前端 + 3 新组件

### Phase 5：首页升级 + 推荐工具迁移
- [ ] 新首页 `/`（产品 + 内容组合）
- [ ] 推荐工具页 `/tools/recommend`（迁移现有逻辑）
- [ ] HeroSection 增加 variant 支持
- [ ] 推荐工具页增加解释层（推荐理由、权衡说明、排序原因）
- [ ] 修改现有组件适配新路由

**文件数：** 3 新 + 3 改

### Phase 6：SEO 打磨 + i18n
- [ ] 全站 metadata 配置（每页独立 title + description + OG tags）
- [ ] JSON-LD 结构化数据（BreadcrumbList、Article、FAQ）
- [ ] sitemap.xml 动态生成
- [ ] robots.txt 配置
- [ ] 内部链接矩阵接通
- [ ] i18n 补充（新增约 200 key）
- [ ] 面包屑导航注入所有详情页
- [ ] 语义化 HTML 审查

**文件数：** ~5 改

---

## 九、数据获取策略

| 页面类型 | 策略 | 原因 |
|----------|------|------|
| 首页 | SSG（构建时生成） | 内容来自 mock 数据，不需实时 |
| 模型列表 | SSR（请求时渲染） | 支持搜索/筛选参数 |
| 模型详情 | `generateStaticParams` + SSG | 47 页，构建时全部生成 |
| GPU 列表 | SSR | 支持搜索/筛选 |
| GPU 详情 | `generateStaticParams` + SSG | 26 页，构建时全部生成 |
| 资讯列表 | SSR | 支持分页 + 分类筛选 |
| 资讯详情 | SSR | 从 API 取数据渲染 |
| 法务页面 | SSG | 纯静态内容 |
| 推荐工具 | CSR（客户端） | 需要浏览器 WebGL API |
| 管理后台 | CSR（客户端） | 登录态 + 编辑器 |

---

## 十、SEO 检查清单

- [ ] 每页独立 `metadata` export（title + description + og:tags）
- [ ] JSON-LD 结构化数据（BreadcrumbList、Article、FAQ）
- [ ] 语义化 HTML（`<article>`, `<section>`, `<nav>`, `<main>`）
- [ ] 每页唯一 H1，H2/H3 层级合理
- [ ] 语义化 URL（kebab-case slug）
- [ ] `generateStaticParams` 预生成所有动态路由
- [ ] `sitemap.xml` 通过 `sitemap.ts` 生成
- [ ] `robots.txt` 通过 `robots.ts` 生成
- [ ] 内部链接矩阵：模型 ↔ GPU ↔ 资讯 ↔ 教程 互链
- [ ] 面包屑导航 + BreadcrumbList schema
- [ ] Canonical URL

---

## 十一、i18n 扩展计划

当前：80 key → 目标：~300 key

新增分类：
- `nav.*` — 导航菜单文案
- `footer.*` — 底栏文案
- `breadcrumb.*` — 面包屑文案
- `model.*` — 模型相关扩展
- `gpu.*` — GPU 相关
- `news.*` — 资讯相关
- `about.*` — 关于页面文案
- `contact.*` — 联系页面文案
- `privacy.*` — 隐私政策文案
- `terms.*` — 服务条款文案
- `seo.*` — SEO meta 文案
- `faq.*` — FAQ 文案
- `home.*` — 首页文案扩展

---

## 十二、技术决策记录

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 重构策略 | 增量构建 | 保留全部现有核心代码，避免风险 |
| 内容管理 | 数据库驱动 | 即时更新、无需重建、操作门槛低 |
| 管理认证 | 环境变量密码 | 单用户够用，多层防御保证安全 |
| 博客链接 | 外部 URL 占位 | 用户后期配置自有博客地址 |
| 资讯定位 | 混合（行业+更新+教程） | 一页承载多元内容，方便运营 |
| 部署方式 | 自建服务器 | 用户自购域名，非 Vercel |

---

## 附录：关键约束

1. **Backend 零改动** — 所有现有 API、服务、评分系统不动
2. **核心功能不降级** — 硬件检测 + 推荐引擎保持完整
3. **MVP 不做** — 用户系统、支付、社区、模型推理、云 GPU
4. **每个页面内容充实** — 禁止空白页、禁止纯模板堆砌
5. **原创内容优先** — 不搬运、不拼接、不自动生成空泛文案
6. **移动端友好** — Mobile First, Responsive
7. **Dark Mode** — 全局支持，新组件继承现有主题系统
