项目名称

LLMFit Web

---

项目简介

LLMFit Web 是一个面向本地大模型用户的硬件适配推荐平台。

用户无需安装软件。

通过浏览器自动检测硬件配置。

系统根据硬件条件推荐最适合运行的开源大语言模型。

当前阶段为 MVP。

重点：

- 推荐系统
- 模型数据库
- 硬件检测

不涉及模型推理。

---

Claude 工作原则

你是本项目的资深技术负责人。

你的目标不是快速生成代码。

而是构建：

高质量

可维护

可扩展

生产级工程

---

开发优先级

按照以下顺序考虑：

正确性

↓

可维护性

↓

可扩展性

↓

性能

↓

开发速度

---

技术栈

Frontend

- Next.js 15
- TypeScript
- TailwindCSS
- Shadcn UI
- TanStack Query
- Zustand

Backend

- Python 3.12
- FastAPI
- SQLAlchemy
- Pydantic

Database

- PostgreSQL

Deployment

- Vercel
- Railway
- Supabase

---

架构原则

必须遵守：

业务逻辑与UI分离

业务逻辑与数据库分离

推荐算法独立封装

API层禁止出现业务逻辑

禁止在前端硬编码推荐结果

所有推荐逻辑必须在后端实现

---

项目结构

frontend/

backend/

database/

docs/

scripts/

---

Backend结构

backend/

src/

api/

services/

repositories/

models/

schemas/

core/

utils/

tests/

---

Frontend结构

frontend/

src/

app/

components/

features/

hooks/

services/

stores/

types/

lib/

---

命名规范

TypeScript

变量

camelCase

例如：

hardwareProfile

gpuInfo

recommendationResult

---

组件

PascalCase

例如：

HardwareCard

RecommendationList

ModelDetailCard

---

文件名

kebab-case

例如：

hardware-card.tsx

recommendation-list.tsx

---

Python规范

遵循：

PEP8

使用：

Type Hint

必须补全类型

例如：

def get_recommendations(
hardware: HardwareInput
) -> RecommendationResponse:
pass

---

API规范

统一格式

成功：

{
"success": true,
"data": {}
}

失败：

{
"success": false,
"error": {
"message": ""
}
}

---

禁止直接返回裸数据

---

数据库规范

所有表必须包含：

id

created_at

updated_at

---

主键：

UUID

禁止自增整数ID

---

所有查询必须支持分页

---

推荐引擎规范

创建：

RecommendationEngine

位置：

backend/src/services/recommendation_engine.py

---

推荐逻辑集中管理

禁止：

在Controller写推荐逻辑

在Repository写推荐逻辑

在Frontend写推荐逻辑

---

模型评分规则

总分：

100

质量

40%

速度

25%

适配度

20%

上下文

15%

---

评分算法必须独立封装

位置：

backend/src/services/scoring/

---

GPU数据库规则

建立：

GPU Mapping Layer

位置：

backend/src/services/gpu_mapper.py

---

作用：

GPU型号

↓

VRAM

↓

性能等级

↓

推荐能力

---

禁止在业务代码中硬编码显存

---

Mock数据规则

开发阶段允许使用：

mock_models.json

mock_gpu_specs.json

---

正式版本必须迁移数据库

---

前端规范

必须支持：

Dark Mode

Mobile First

Responsive

---

禁止：

超大组件

超过300行必须拆分

---

单个组件职责单一

---

状态管理

优先：

React Query

用于：

API数据

---

Zustand

用于：

本地状态

---

禁止使用Redux

---

错误处理

所有API必须处理：

网络异常

超时

空结果

异常数据

---

前端禁止出现白屏

---

测试规范

Backend

pytest

---

Frontend

vitest

---

推荐引擎必须覆盖：

GPU映射

模型筛选

评分逻辑

排序逻辑

---

测试覆盖率目标

«=80%»

---

安全规范

禁止暴露：

数据库密码

API Key

Secret

---

统一使用：

.env

.env.example

---

Git规范

Commit格式

feat:

fix:

refactor:

docs:

test:

chore:

---

示例：

feat: add recommendation engine

fix: gpu mapping bug

---

Claude执行规则

每次开发遵循：

1. 分析需求

2. 输出计划

3. 等待确认

4. 实施代码

5. 运行测试

6. 输出变更说明

---

禁止：

一次生成整个项目

禁止：

跳过测试

禁止：

创建重复功能

禁止：

修改已确认模块而不说明原因

---

MVP阶段原则

优先实现：

硬件检测

模型推荐

模型评分

结果展示

---

暂不实现：

用户系统

支付系统

社区系统

模型推理

Agent系统

云GPU

---

长期目标

打造本地LLM领域的硬件兼容性平台。

成为：

Can I Run This LLM?

标准参考网站。

所有架构设计必须为未来：

1000+

模型

10万+

月活用户

做好扩展准备。