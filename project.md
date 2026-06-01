项目名称

LLMFit Web

副标题：

Can I Run This LLM？

输入你的电脑配置，自动推荐最适合运行的大语言模型。

---

项目愿景

打造一个面向本地大模型用户的硬件适配平台。

用户无需安装任何软件，只需打开网页，即可自动检测当前电脑配置，并获得最适合运行的开源大模型推荐。

长期目标：

成为本地大模型领域的「PCPartPicker」。

帮助用户解决：

- 我的电脑能运行哪些模型？
- 哪个模型最适合我的配置？
- 推理速度大概是多少？
- 需要多少显存？
- 如果升级硬件，最值得升级什么？

---

MVP目标

在第一阶段，仅实现：

浏览器自动检测硬件

↓

匹配硬件数据库

↓

匹配模型数据库

↓

返回推荐结果

不涉及：

- 模型推理
- 用户登录
- 支付系统
- 云端GPU
- 本地Agent

---

核心用户

用户群体1

本地模型玩家

使用：

- Ollama
- LM Studio
- Open WebUI

痛点：

不知道该下载哪个模型。

---

用户群体2

AI开发者

需要快速评估：

某台电脑适合部署什么模型。

---

用户群体3

硬件玩家

希望了解：

当前配置的极限能力。

以及未来升级方向。

---

功能需求

功能1：自动检测硬件

浏览器自动获取：

RAM

CPU线程数

操作系统

GPU型号

使用：

navigator.deviceMemory

navigator.hardwareConcurrency

navigator.userAgent

navigator.gpu（WebGPU）

---

功能2：模型推荐

根据：

RAM

CPU

GPU

VRAM（数据库映射）

计算适合运行的模型。

输出：

推荐模型列表。

---

功能3：模型评分

每个模型展示：

质量评分

速度评分

适配评分

上下文评分

综合评分

范围：

0-100分

---

功能4：升级建议

例如：

当前：

RTX 3060 12GB

推荐升级：

RTX 5070

获得：

+40%速度

支持更大参数模型

---

技术栈

前端

Next.js 15

TypeScript

TailwindCSS

Shadcn UI

TanStack Query

Zustand

---

后端

Python 3.12

FastAPI

SQLAlchemy

Pydantic

Alembic

---

数据库

PostgreSQL

部署：

Supabase

---

部署

前端：

Vercel

后端：

Railway

数据库：

Supabase

---

数据库设计

gpu_specs

字段：

id

name

vendor

estimated_vram

benchmark_score

tier

created_at

updated_at

---

models

字段：

id

family

name

parameter_count_b

quantization

min_vram

recommended_vram

context_length

quality_score

download_url

huggingface_repo

created_at

updated_at

---

推荐算法

第一步

根据GPU型号估算VRAM

例如：

RTX 3060

→ 12GB

RTX 4090

→ 24GB

Apple M4 Max

→ 48GB Unified Memory

---

第二步

过滤无法运行的模型

如果：

模型推荐显存 > 当前显存

则标记：

不推荐

---

第三步

评分计算

质量

40%

速度

25%

适配度

20%

上下文能力

15%

最终输出：

综合评分

---

页面设计

首页

标题：

Can I Run This LLM？

副标题：

自动分析你的电脑，并推荐最适合运行的大语言模型。

按钮：

Analyze My PC

---

结果页

显示：

GPU

RAM

CPU

操作系统

---

展示：

Top 10 推荐模型

---

展示：

升级建议

---

模型详情页

显示：

模型参数量

显存需求

推荐显存

上下文长度

预估速度

下载链接

---

MVP首批支持模型

Qwen3

Llama 3.1

Gemma 3

Mistral Small

DeepSeek Distill

预计总数：

50个模型

---

成功指标

首月目标：

1000用户

推荐接口响应：

小于500ms

页面加载：

小于2秒

服务器成本：

小于20美元/月

---

开发原则

严格TypeScript

移动端优先

前后端解耦

推荐算法独立

支持后续扩展

禁止前端硬编码推荐逻辑

优先保证可维护性