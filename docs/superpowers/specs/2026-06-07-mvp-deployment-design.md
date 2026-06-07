# MVP 部署方案

> **状态**: 待用户审阅
> **日期**: 2026-06-07
> **目标**: 将 LLMFit Web MVP 从本地开发环境部署到生产环境

---

## 架构总览

```
用户浏览器
    │
    ▼
Vercel (Next.js 16)          ← 静态资源 CDN + SSR
    │  llmfit.vercel.app
    │
    ▼
Railway (FastAPI)             ← 计算层，推荐引擎
    │  llmfit-api.up.railway.app
    │
    ▼
Supabase (PostgreSQL)         ← 数据层，GPU + 模型数据
    │  db.xxxxx.supabase.co:6543
```

**为什么是这个组合？**

| 层 | 选择 | 理由 |
|---|---|---|
| 前端 | Vercel | Next.js 原生支持，自动 CI/CD，免费额度充裕（100GB 带宽/月） |
| 后端 | Railway | 简单部署 Python，自动 HTTPS，内置环境变量管理，$5/月起 |
| 数据库 | Supabase | 托管 PostgreSQL，免费 500MB，自带连接池（PgBouncer 端口 6543） |

> **注意**：Railway 也提供内置 PostgreSQL。但你已有 Supabase 在 project.md 中选定，且 Supabase 的免费层更充裕、管理 UI 更好用。如果你想减少服务数量，可以用 Railway 的内置 PG 替代 Supabase —— 但当前方案按 project.md 的原计划执行。

---

## Phase 1: Supabase 数据库

### 1.1 创建 Supabase 项目

1. 访问 https://supabase.com → Sign in with GitHub
2. 点击 **New project**
3. 配置：
   - **Name**: `llmfit`
   - **Database Password**: 生成一个强密码（记下来，后续要用）
   - **Region**: 选择离用户最近的区域（亚洲用户选 Singapore 或 Tokyo）
   - **Pricing Plan**: Free（500MB 数据库 + 50MB 文件存储）
4. 等待项目创建完成（约 2 分钟）

### 1.2 获取连接字符串

Supabase 项目就绪后，进入 **Settings → Database**：

```
# 直连（端口 5432，IPv4）
Host: db.xxxxxxxxx.supabase.co
Port: 5432

# 连接池（端口 6543，PgBouncer，推荐用于应用连接）
Host: db.xxxxxxxxx.supabase.co
Port: 6543

User: postgres
Password: [创建项目时设置的密码]
```

### 1.3 配置本地 Alembic 指向 Supabase

修改 `backend/.env`，验证连接：

```env
SYNC_DATABASE_URL=postgresql://postgres:[password]@db.xxxxxxxxx.supabase.co:6543/postgres
DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.xxxxxxxxx.supabase.co:6543/postgres
```

> **为什么用 6543？** Supabase 的 5432 是直连，强制 IPv4。6543 端口内置 PgBouncer 连接池，也支持 IPv6。Serverless 平台（Vercel/Railway）建议用 6543。

### 1.4 运行迁移 + 验证

```bash
cd backend

# 运行 Alembic 迁移建表
alembic upgrade head

# 预期输出：两个迁移文件成功执行
# Running upgrade  -> 8c0970b40e24, initial: models and gpu_specs tables
# Running upgrade 8c0970b40e24 -> 20260604..., news_posts table

# 验证：启动后端，确认 SQL 仓库可用
python -m pytest tests/ -x -q

# 预期 response：
# - 后端启动日志显示 "Database available — using SQL repositories."
# - 所有测试通过
```

### 1.5 填充数据

✅ **seed 脚本已存在**（`backend/scripts/seed.py` + `backend/seed_news.py`），无需新写。

**数据源**：
- `backend/src/data/mock_gpu_specs.json` → 396 个 GPU
- `backend/src/data/mock_models.json` → 模型数据
- `backend/src/data/news_posts.json` → 新闻文章

**执行步骤**：

```bash
cd backend

# Step 1: 确认 .env 中 SYNC_DATABASE_URL 指向 Supabase
# SYNC_DATABASE_URL=postgresql://postgres:[pwd]@db.xxx.supabase.co:6543/postgres

# Step 2: 填充 GPU + 模型数据（idempotent，可安全重复执行）
python -m scripts.seed

# 预期输出：
# Seeded 50 models + 396 GPUs.

# Step 3: 填充新闻文章
python seed_news.py

# 预期输出：
# Created: [slug1]
# Created: [slug2]
# ...
# Seeded N articles into the database.

# Step 4: 验证
python -m scripts.seed --dry-run
# 预期输出：列出所有已有记录（dry-run 不写入）
```

> seed 脚本使用 `ON CONFLICT DO UPDATE`（upsert），重复执行不会产生重复数据，安全幂等。

---

## Phase 2: Railway 后端

### 2.1 准备部署配置

在项目根目录创建 `backend/Procfile`（Railway 原生支持）：

```
web: uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

或者创建 `backend/railway.toml`：

```toml
[build]
builder = "nixpacks"
watch = ["src/", "alembic/"]

[deploy]
startCommand = "uvicorn src.main:app --host 0.0.0.0 --port $PORT"
numReplicas = 1
```

> Railway 的 Nixpacks 会自动检测 Python 项目（通过 `pyproject.toml`），无需 Dockerfile。

### 2.2 设置环境变量

在 Railway Dashboard → 项目 → Variables 中设置：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `APP_NAME` | `LLMFit Web` | |
| `APP_VERSION` | `0.1.0` | |
| `DEBUG` | `false` | 生产环境必须关闭 |
| `CORS_ORIGINS` | `https://llmfit.vercel.app` | Vercel 域名（部署前端后更新） |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:[pwd]@db.xxx.supabase.co:6543/postgres` | Supabase 连接池 |
| `SYNC_DATABASE_URL` | `postgresql://postgres:[pwd]@db.xxx.supabase.co:6543/postgres` | Supabase 连接池（同步） |
| `ADMIN_PASSWORD` | `[你的管理员密码]` | 用于管理 API |

### 2.3 部署步骤

1. 将代码推送到 GitHub 仓库（公开或私有）
2. 访问 https://railway.app → New Project → Deploy from GitHub
3. 选择仓库，设置 **Root Directory** = `backend`
4. Railway 自动检测 Python 项目 → 构建 → 部署
5. 首次部署后，记下分配的默认域名：`llmfit-api.up.railway.app`

### 2.4 部署后验证

```bash
# 健康检查
curl https://llmfit-api.up.railway.app/health

# 预期响应：
# {"status": "ok", "version": "0.1.0"}

# 测试推荐接口
curl -X POST https://llmfit-api.up.railway.app/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"gpuName": "NVIDIA GeForce RTX 3060", "ramGb": 16, "cpuCores": 8, "os": "Windows"}'

# 预期：返回 JSON 推荐结果
```

### 2.5 注意事项

- **Railway 免费层限制**：每月 $5 额度（约 500 小时运行时间）。一个副本够用。
- **冷启动**：免费层 30 分钟无请求后会休眠。首次请求会慢（约 20 秒启动）。如果介意，升级到 $5/月的 Hobby 计划。
- **CORS**：部署前端后记得更新 `CORS_ORIGINS` 为 Vercel 实际域名。

---

## Phase 3: Vercel 前端

### 3.1 准备构建配置

`frontend/next.config.ts` 已存在，无需大改动。确认以下几点：

```typescript
// frontend/next.config.ts — 确认无问题，无需修改
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 目前为空，Vercel 使用默认配置即可
};

export default nextConfig;
```

### 3.2 设置环境变量

在 Vercel Dashboard → 项目 → Settings → Environment Variables：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://llmfit-api.up.railway.app/api/v1` | 后端 API 地址 |

> **注意**：`NEXT_PUBLIC_*` 变量会在构建时注入客户端 bundle。每次修改后需要重新部署。

### 3.3 部署步骤

1. 推送代码到 GitHub
2. 访问 https://vercel.com → Add New Project
3. 导入仓库，设置 **Root Directory** = `frontend`
4. Framework 自动检测为 **Next.js**
5. 添加环境变量（见 3.2）
6. 点击 **Deploy**
7. 记下分配的生产域名：`llmfit.vercel.app`

### 3.4 部署后验证

```bash
# 1. 首页可访问
curl -I https://llmfit.vercel.app
# 预期：HTTP 200

# 2. API 调用正常（打开浏览器 DevTools → Network）
# 页面加载后，确认 /api/v1/recommend 请求成功返回 200

# 3. 硬件检测正常
# 浏览器打开页面，确认：
#   - GPU 检测显示正常
#   - 模型推荐列表渲染正确
#   - Dark mode 切换正常
#   - 中英文切换正常

# 4. 所有页面正常
# 访问以下路径确认：
#   /gpus         — GPU 列表
#   /gpus/[slug]  — GPU 详情
#   /models       — 模型列表
#   /models/[slug]— 模型详情
#   /news         — 新闻页
#   /tools/recommend — 推荐工具
```

### 3.5 Vercel 免费层限制

| 限制项 | 免费额度 | MVP 是否够用 |
|--------|---------|-------------|
| 带宽 | 100 GB/月 | ✅ 充裕 |
| 构建次数 | 6000 分钟/月 | ✅ 充裕 |
| Serverless 函数执行 | 100 GB-小时/月 | ✅ 充裕 |
| 边缘函数请求 | 100 万/月 | ✅ 充裕 |
| 商业用途 | ✅ 允许 | ✅ |

---

## Phase 4: 部署后检查清单

### 功能验证

- [ ] 首页加载 → 硬件自动检测 → 推荐结果显示
- [ ] GPU 手动切换 → 推荐结果自动刷新
- [ ] GPU 库页面 → 396 个 GPU 正确展示
- [ ] GPU 详情页 → VRAM/跑分/兼容模型正确显示
- [ ] 模型库页面 → 模型列表正确展示
- [ ] 模型详情页 → 参数/显存/评分正确显示
- [ ] 中文 locale → 所有页面中文标签正确
- [ ] 英文 locale → 所有页面英文标签正确
- [ ] Admin 页面 → 密码保护正常

### 性能验证

- [ ] 推荐 API 响应 < 500ms
- [ ] 首页完整加载 < 2s
- [ ] Vercel Analytics 无报错
- [ ] Railway 日志无异常

### 安全检查

- [ ] `.env` 文件不在 Git 仓库中（已有 `.gitignore`）
- [ ] Supabase 数据库密码不泄露
- [ ] Admin 密码强度足够
- [ ] CORS 只允许 Vercel 域名
- [ ] `DEBUG=false`（生产环境）

---

## 月成本估算

| 服务 | 计划 | 月费 |
|------|------|------|
| Supabase | Free | $0 |
| Railway | Free (or Hobby) | $0 (or $5) |
| Vercel | Free | $0 |
| **总计** | | **$0/月**（免费层） |

> 免费层足以支撑 MVP 阶段（1000 月活用户目标）。当用户量增长到需要付费时，说明产品已获市场验证。

---

## 文件变更汇总

部署本身不修改业务代码。需要创建/修改的配置文件：

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/Procfile` 或 `railway.toml` | 新建 | Railway 启动命令 |
| `backend/.env` | 修改 | `DATABASE_URL`/`SYNC_DATABASE_URL` 指向 Supabase |
| `frontend/.env.local` | 修改 | `NEXT_PUBLIC_API_URL` 指向 Railway（可选，Vercel 环境变量覆盖） |

> 不需要 `Dockerfile`（Railway Nixpacks 自动处理），不需要 `vercel.json`（Next.js 默认配置即可）。

---

## 尚未处理的事项（后续迭代）

- [ ] 自定义域名（DNS 配置 + SSL）
- [ ] CI/CD 自动化测试（GitHub Actions）
- [ ] 监控 & 告警（Sentry / Logtail）
- [ ] 自动备份（Supabase 已内置每日备份）
- [ ] 数据填充脚本（seed script 自动化）
