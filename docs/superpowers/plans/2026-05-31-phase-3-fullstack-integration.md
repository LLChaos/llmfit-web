# Phase 3: 全栈联调 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 连接前后端推荐流程，构建结果展示组件，实现端到端用户流程：检测硬件 → 调用推荐 API → 展示结果 → 模型详情弹窗 → 升级建议。

**Architecture:** 前端用 TanStack Query 管理 API 数据（推荐结果、模型详情），Zustand 管理本地 UI 状态（排序偏好、选中模型）。后端补齐模型列表 API。组件按职责拆分：HardwareCard（硬件展示）→ RecommendationList（列表+排序）→ ModelCard（卡片）→ ModelDetailModal（弹窗）→ UpgradeSuggestions（升级）。所有组件覆盖 loading/error/empty 三态，移动端优先。

**Tech Stack:** Next.js 15, TypeScript, TailwindCSS, Shadcn UI, TanStack Query, Zustand

---

## 文件结构预览

```
backend/
├── src/api/models.py                        ← MODIFY: 接入真实数据

frontend/src/
├── hooks/
│   └── use-recommendations.ts               ← NEW: TanStack Query hook
├── stores/
│   └── recommendation-store.ts              ← NEW: 排序/选中状态
├── components/
│   ├── hardware-card.tsx                     ← NEW: 硬件信息卡片
│   ├── model-card.tsx                        ← NEW: 模型推荐卡片
│   ├── recommendation-list.tsx               ← NEW: 推荐列表+排序
│   ├── model-detail-modal.tsx                ← NEW: 模型详情弹窗
│   ├── upgrade-suggestions.tsx               ← NEW: 升级建议
│   ├── hero-section.tsx                      ← MODIFY: 检测后触发 API
│   └── results-section.tsx                   ← NEW: 结果汇总容器
├── app/
│   └── page.tsx                              ← MODIFY: 串联完整流程
```

---

### Task 1: 后端模型 API 接入真实数据

**Files:**
- Modify: `backend/src/api/models.py`

将占位端点接入 JsonModelRepository，使前端能获取模型列表和详情。

- [ ] **Step 1: 更新 models.py**

用以下内容替换 `backend/src/api/models.py`：

```python
"""Model listing endpoints."""

import os

from fastapi import APIRouter, HTTPException

from src.repositories.json_model_repository import JsonModelRepository
from src.schemas.common import ApiResponse, PaginatedData
from src.schemas.model import ModelListItem, ModelDetail

router = APIRouter(prefix="/models", tags=["models"])

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
_repo = JsonModelRepository(os.path.join(_DATA_DIR, "mock_models.json"))


@router.get("", response_model=ApiResponse[PaginatedData[ModelListItem]])
async def list_models(
    page: int = 1,
    size: int = 20,
    family: str | None = None,
) -> ApiResponse[PaginatedData[ModelListItem]]:
    """List all models with pagination and optional family filter."""
    result = _repo.get_all(page=page, size=size, family=family)
    models = [ModelListItem(**m) for m in result["items"]]
    return ApiResponse.ok(
        PaginatedData(
            items=models,
            total=result["total"],
            page=result["page"],
            size=result["size"],
        )
    )


@router.get("/{model_id}", response_model=ApiResponse[ModelDetail])
async def get_model(model_id: str) -> ApiResponse[ModelDetail]:
    """Get model detail by ID."""
    model = _repo.get_by_id(model_id)
    if model is None:
        raise HTTPException(
            status_code=404,
            detail={"message": f"Model '{model_id}' not found"},
        )
    return ApiResponse.ok(ModelDetail(**model))
```

- [ ] **Step 2: 验证后端 API**

```bash
cd backend && source venv/Scripts/activate
curl -s http://localhost:8000/api/v1/models?size=2 | python -m json.tool | head -20
curl -s http://localhost:8000/api/v1/models/qwen3-8b-q4 | python -m json.tool | head -20
```

Expected: 返回真实模型数据

- [ ] **Step 3: 运行后端全量测试确认无回归**

```bash
cd backend && python -m pytest tests/ -v
```
Expected: 77 PASS

- [ ] **Step 4: Commit**

```bash
git add backend/src/api/models.py
git commit -m "feat: wire model listing API to JsonModelRepository"
```

---

### Task 2: 推荐结果 Zustand Store + TanStack Query Hook

**Files:**
- Create: `frontend/src/stores/recommendation-store.ts`
- Create: `frontend/src/hooks/use-recommendations.ts`

- [ ] **Step 1: 创建 recommendation-store.ts**

```typescript
"use client";

import { create } from "zustand";
import type { RecommendedModel } from "@/types/recommendation";

type SortKey = "total" | "quality" | "speed";

interface RecommendationState {
  /** Sort preference */
  sortBy: SortKey;
  /** Selected model for detail modal (null = modal closed) */
  selectedModel: RecommendedModel | null;

  setSortBy: (key: SortKey) => void;
  selectModel: (model: RecommendedModel | null) => void;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  sortBy: "total",
  selectedModel: null,
  setSortBy: (sortBy) => set({ sortBy }),
  selectModel: (selectedModel) => set({ selectedModel }),
}));
```

- [ ] **Step 2: 创建 use-recommendations.ts**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import type { HardwareInput } from "@/types/hardware";

export function useRecommendations(hardware: HardwareInput | null) {
  return useQuery({
    queryKey: ["recommendations", hardware],
    queryFn: () => apiClient.recommend(hardware!),
    enabled: !!hardware,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add frontend/src/stores/recommendation-store.ts frontend/src/hooks/use-recommendations.ts
git commit -m "feat: add recommendation store and TanStack Query hook"
```

---

### Task 3: HardwareCard 组件

**Files:**
- Create: `frontend/src/components/hardware-card.tsx`

展示后端解析后的硬件信息（GPU/VRAM/RAM/CPU/OS/Tier），含 loading skeleton。

- [ ] **Step 1: 创建 hardware-card.tsx**

```typescript
"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HardwareInfo } from "@/types/hardware";
import { Monitor, Cpu, HardDrive, Microchip, Zap, Layers } from "lucide-react";

interface HardwareCardProps {
  hardware: HardwareInfo | null;
  isLoading: boolean;
}

export function HardwareCard({ hardware, isLoading }: HardwareCardProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hardware) return null;

  const specs = [
    { icon: Monitor, label: t("hardware.gpu"), value: hardware.gpuName },
    { icon: Zap, label: t("hardware.vram"), value: `${hardware.vramGb} GB` },
    { icon: HardDrive, label: t("hardware.ram"), value: `${hardware.ramGb} GB` },
    { icon: Cpu, label: t("hardware.cpu"), value: `${hardware.cpuCores} threads` },
    { icon: Microchip, label: t("hardware.os"), value: hardware.os },
    { icon: Layers, label: t("hardware.tier"), value: hardware.gpuTier },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Hardware Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {specs.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-lg border p-3"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-medium truncate">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 需要安装 lucide-react 图标库**

```bash
cd frontend && npm install lucide-react
```

- [ ] **Step 3: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/hardware-card.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add HardwareCard component with loading skeleton"
```

---

### Task 4: ModelCard 组件

**Files:**
- Create: `frontend/src/components/model-card.tsx`

展示单个推荐模型的评分、VRAM、TPS、可运行标记。点击触发详情弹窗。

- [ ] **Step 1: 创建 model-card.tsx**

```typescript
"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecommendedModel } from "@/types/recommendation";
import { CheckCircle, XCircle } from "lucide-react";

interface ModelCardProps {
  model: RecommendedModel;
  onClick: (model: RecommendedModel) => void;
}

export function ModelCard({ model, onClick }: ModelCardProps) {
  const { t } = useTranslation();

  const scorePercent = Math.round(model.scores.total);
  const ringColor =
    scorePercent >= 80
      ? "text-green-500"
      : scorePercent >= 60
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <Card
      className="w-full cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onClick(model)}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Rank badge */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {model.rank}
        </span>

        {/* Model info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{model.modelId}</h3>
            {model.runnable ? (
              <Badge variant="outline" className="gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                {t("recommendation.runnable")}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-red-500">
                <XCircle className="h-3 w-3" />
                {t("recommendation.not_runnable")}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t("model.estimated_speed")}: {model.estimatedTokensPerSec} tok/s
            </span>
            <span>
              {t("model.vram_required")}: {model.estimatedVramGb} GB
            </span>
          </div>
        </div>

        {/* Score ring */}
        <div className="flex shrink-0 flex-col items-center">
          <svg className="h-12 w-12" viewBox="0 0 36 36">
            <path
              className="stroke-muted/30 fill-none"
              strokeWidth="3"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`fill-none ${ringColor}`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${scorePercent}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text
              x="18"
              y="20.5"
              textAnchor="middle"
              className="fill-foreground text-[10px] font-bold"
            >
              {scorePercent}
            </text>
          </svg>
          <span className="text-[10px] text-muted-foreground">
            {t("score.total")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 添加 Badge 组件**

```bash
cd frontend && npx shadcn@latest add badge
```

- [ ] **Step 3: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/model-card.tsx frontend/src/components/ui/badge.tsx
git commit -m "feat: add ModelCard component with score ring and runnable badge"
```

---

### Task 5: RecommendationList 组件

**Files:**
- Create: `frontend/src/components/recommendation-list.tsx`

展示 Top 10 推荐列表，含排序切换（综合/质量/速度），空结果显示提示。

- [ ] **Step 1: 创建 recommendation-list.tsx**

```typescript
"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useRecommendationStore } from "@/stores/recommendation-store";
import { ModelCard } from "@/components/model-card";
import type { RecommendedModel } from "@/types/recommendation";

interface RecommendationListProps {
  models: RecommendedModel[];
  isLoading: boolean;
}

export function RecommendationList({
  models,
  isLoading,
}: RecommendationListProps) {
  const { t } = useTranslation();
  const { sortBy, setSortBy, selectModel } = useRecommendationStore();

  const sorted = [...models].sort((a, b) => {
    switch (sortBy) {
      case "quality":
        return b.scores.quality - a.scores.quality;
      case "speed":
        return b.scores.speed - a.scores.speed;
      default:
        return b.scores.total - a.scores.total;
    }
  });

  const sortOptions = [
    { key: "total" as const, label: t("recommendation.sort_total") },
    { key: "quality" as const, label: t("recommendation.sort_quality") },
    { key: "speed" as const, label: t("recommendation.sort_speed") },
  ];

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">{t("recommendation.title")}</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </section>
    );
  }

  if (models.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">{t("recommendation.title")}</h2>
        <p className="text-center text-muted-foreground py-12">
          {t("recommendation.empty")}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("recommendation.title")}</h2>
        <div className="flex gap-1">
          <span className="text-sm text-muted-foreground self-center mr-2">
            {t("recommendation.sort_by")}:
          </span>
          {sortOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                sortBy === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((model) => (
          <ModelCard
            key={model.modelId}
            model={model}
            onClick={selectModel}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/recommendation-list.tsx
git commit -m "feat: add RecommendationList component with sort controls and empty state"
```

---

### Task 6: ModelDetailModal 组件

**Files:**
- Create: `frontend/src/components/model-detail-modal.tsx`

点击 ModelCard 时弹出模型完整详情（参数、下载链接、HuggingFace 链接）。

- [ ] **Step 1: 创建 model-detail-modal.tsx**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { useRecommendationStore } from "@/stores/recommendation-store";
import { apiClient } from "@/services/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

export function ModelDetailModal() {
  const { t } = useTranslation();
  const { selectedModel, selectModel } = useRecommendationStore();

  const { data: detail, isLoading } = useQuery({
    queryKey: ["model-detail", selectedModel?.modelId],
    queryFn: () => apiClient.getModel(selectedModel!.modelId),
    enabled: !!selectedModel,
  });

  return (
    <Dialog
      open={!!selectedModel}
      onOpenChange={(open) => !open && selectModel(null)}
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("model.detail_title")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-5 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{detail.name}</h3>
              <p className="text-sm text-muted-foreground">
                {detail.family}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <DetailRow
                label={t("model.parameters")}
                value={`${detail.parameterCountB}B`}
              />
              <DetailRow
                label="Quantization"
                value={`${detail.quantization} (${detail.quantizationBits}-bit)`}
              />
              <DetailRow
                label={t("model.vram_required")}
                value={`${detail.recommendedVramGb} GB (min ${detail.minVramGb} GB)`}
              />
              <DetailRow
                label={t("model.context_length")}
                value={detail.contextLength.toLocaleString()}
              />
              <DetailRow label="Hidden Dim" value={String(detail.hiddenDim)} />
              <DetailRow label="Layers" value={String(detail.numLayers)} />
              <DetailRow
                label="Quality Score"
                value={`${detail.qualityScore}/100`}
              />
            </div>

            {/* Scores from recommendation */}
            {selectedModel && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Estimated Performance
                </p>
                <div className="flex gap-4 text-sm">
                  <span>
                    {t("model.estimated_speed")}:{" "}
                    <strong>{selectedModel.estimatedTokensPerSec} tok/s</strong>
                  </span>
                  <span>
                    VRAM: <strong>{selectedModel.estimatedVramGb} GB</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={detail.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-1 h-4 w-4" />
                  {t("model.download")}
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://huggingface.co/${detail.huggingfaceRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1 h-4 w-4" />
                  {t("model.view_on_hf")}
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/model-detail-modal.tsx
git commit -m "feat: add ModelDetailModal with full specs and external links"
```

---

### Task 7: UpgradeSuggestions 组件 + ResultsSection 容器

**Files:**
- Create: `frontend/src/components/upgrade-suggestions.tsx`
- Create: `frontend/src/components/results-section.tsx`

- [ ] **Step 1: 创建 upgrade-suggestions.tsx**

```typescript
"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import type { UpgradeSuggestion } from "@/types/recommendation";
import { ArrowRight, TrendingUp, Cpu } from "lucide-react";

interface UpgradeSuggestionsProps {
  suggestions: UpgradeSuggestion[];
}

export function UpgradeSuggestions({ suggestions }: UpgradeSuggestionsProps) {
  const { t } = useTranslation();

  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{t("upgrade.title")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s) => (
          <Card key={s.suggestedGpu} className="border-dashed">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("upgrade.current")}:{" "}
                </span>
                <span className="truncate font-medium">{s.currentGpu}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary truncate">
                  {s.suggestedGpu}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {t("upgrade.vram_gain")}: +{s.improvement.vramDeltaGb} GB
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <TrendingUp className="mr-0.5 inline h-3 w-3" />
                  {t("upgrade.speed_boost")}: +{s.improvement.speedBoostPct}%
                </span>
              </div>
              {s.improvement.unlocksModels.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("upgrade.unlocks")}:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {s.improvement.unlocksModels.map((id) => (
                      <span
                        key={id}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 创建 results-section.tsx**

```typescript
"use client";

import { HardwareCard } from "@/components/hardware-card";
import { RecommendationList } from "@/components/recommendation-list";
import { UpgradeSuggestions } from "@/components/upgrade-suggestions";
import { ModelDetailModal } from "@/components/model-detail-modal";
import type { RecommendationResponse } from "@/types/recommendation";
import { useRecommendationStore } from "@/stores/recommendation-store";

interface ResultsSectionProps {
  data: RecommendationResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ResultsSection({
  data,
  isLoading,
  isError,
  onRetry,
}: ResultsSectionProps) {
  const { selectedModel } = useRecommendationStore();

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive text-lg">Error</p>
        <button
          onClick={onRetry}
          className="mt-4 text-sm text-primary underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <HardwareCard hardware={data?.hardware ?? null} isLoading={isLoading} />

      <RecommendationList
        models={data?.recommendations ?? []}
        isLoading={isLoading}
      />

      <UpgradeSuggestions suggestions={data?.upgradeSuggestions ?? []} />

      <ModelDetailModal />
    </div>
  );
}
```

- [ ] **Step 3: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/upgrade-suggestions.tsx frontend/src/components/results-section.tsx
git commit -m "feat: add UpgradeSuggestions and ResultsSection container components"
```

---

### Task 8: HeroSection + page.tsx 串联完整流程

**Files:**
- Modify: `frontend/src/components/hero-section.tsx`
- Modify: `frontend/src/app/page.tsx`

检测完成后自动调用推荐 API，展示结果区域。

- [ ] **Step 1: 修改 hero-section.tsx**

读取 `d:\AImodeldetector\frontend\src\components\hero-section.tsx`，在 `analyze` 后通过回调通知父组件：

将现有的 hero-section.tsx 替换为：

```typescript
"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useHardwareDetection } from "@/hooks/use-hardware-detection";
import { useHardwareStore } from "@/stores/hardware-store";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

interface HeroSectionProps {
  onDetected?: () => void;
}

export function HeroSection({ onDetected }: HeroSectionProps) {
  const { t } = useTranslation();
  const { analyze } = useHardwareDetection();
  const status = useHardwareStore((s) => s.status);

  const isDetecting = status === "detecting";
  const isDetected = status === "detected";

  const handleClick = async () => {
    await analyze();
    onDetected?.();
  };

  return (
    <section
      className={`relative flex flex-col items-center justify-center px-4 text-center transition-all duration-500 ${
        isDetected ? "min-h-0 py-16" : "min-h-screen"
      }`}
    >
      {/* Language switcher — top right */}
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      {/* Hero content */}
      <h1
        className={`max-w-3xl font-bold tracking-tight transition-all ${
          isDetected
            ? "text-2xl sm:text-3xl"
            : "text-4xl sm:text-5xl md:text-6xl"
        }`}
      >
        {t("hero.title")}
      </h1>

      {!isDetected && (
        <>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          <Button
            size="lg"
            className="mt-10 h-14 px-10 text-lg"
            onClick={handleClick}
            disabled={isDetecting}
          >
            {isDetecting ? t("hero.detecting") : t("hero.button")}
          </Button>
        </>
      )}

      {isDetected && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={handleClick}
          disabled={isDetecting}
        >
          {isDetecting ? t("hero.detecting") : "Re-scan Hardware"}
        </Button>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 修改 page.tsx**

替换 `d:\AImodeldetector\frontend\src\app\page.tsx` 为：

```typescript
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useHardwareStore } from "@/stores/hardware-store";

const queryClient = new QueryClient();

function HomeContent() {
  const [shouldFetch, setShouldFetch] = useState(false);
  const hardwareInput = useHardwareStore((s) => s.input);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useRecommendations(shouldFetch ? hardwareInput : null);

  if (!shouldFetch) {
    return <HeroSection onDetected={() => setShouldFetch(true)} />;
  }

  return (
    <main>
      <HeroSection />
      <ResultsSection
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
      />
    </main>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomeContent />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: 验证编译**

```bash
cd frontend && npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 4: 验证前端构建**

```bash
cd frontend && npm run build
```
Expected: 构建成功

- [ ] **Step 5: 端到端验证**

启动后端和前端，进行完整流程测试：

```bash
# Terminal 1
cd backend && source venv/Scripts/activate && uvicorn src.main:app --port 8000

# Terminal 2
cd frontend && npm run dev
```

打开 http://localhost:3000，点击按钮，确认：
1. Hero 收缩
2. HardwareCard 展示硬件信息
3. RecommendationList 展示排序后的推荐模型
4. 点击模型弹出 ModelDetailModal
5. 切换排序生效
6. UpgradeSuggestions 展示升级建议

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/hero-section.tsx frontend/src/app/page.tsx
git commit -m "feat: wire end-to-end flow from detection to recommendation display"
```

---

## 验证清单

Phase 3 完成标准：

- [ ] 后端 `GET /api/v1/models?size=5` 返回真实数据
- [ ] 后端 `GET /api/v1/models/{id}` 返回模型详情
- [ ] 后端全量测试 77 PASS（无回归）
- [ ] 前端 `npm run build` 成功
- [ ] 前端 TypeScript 编译零错误
- [ ] 完整用户流程可走通：检测 → API → 结果展示
- [ ] 三态覆盖：Loading（骨架屏）· Error（重试按钮）· Empty（空提示）
- [ ] 排序切换生效（综合/质量/速度）
- [ ] ModelDetailModal 展示完整参数
- [ ] UpgradeSuggestions 展示升级建议
- [ ] Mobile 响应式正常
- [ ] Dark Mode 正常

---

## 设计决策

1. **TanStack Query vs Zustand**: API 数据（推荐结果、模型详情）用 TanStack Query 管理（缓存/重试/loading 态），本地 UI 状态（排序/选中模型）用 Zustand。
2. **Hero 收缩效果**: 检测完成后 Hero 从 `min-h-screen` 切换到 `min-h-0 py-16` + 字体缩小，平滑过渡。
3. **模型详情加载**: Modal 打开时惰性请求 `GET /api/v1/models/{id}`，利用 TanStack Query 缓存。
4. **组件拆分**: 每个组件 ≤ 150 行，职责单一。`ResultsSection` 做容器编排，不包含展示逻辑。
5. **评分圆环**: SVG 环形图纯 CSS 实现，无额外依赖，percentage 驱动颜色阈值。
