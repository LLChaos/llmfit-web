"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SearchBar } from "@/components/search-bar";
import { FilterBar } from "@/components/filter-bar";
import { ModelCardLink } from "@/components/model-card-link";
import { PageHeader } from "@/components/page-header";
import type { ModelListItem } from "@/types/model";
import type { PaginatedData } from "@/services/api-client";

function filterModels(
  models: ModelListItem[],
  search: string,
  family: string | null,
  paramRange: string | null,
  quantBits: string | null
): ModelListItem[] {
  let result = models;

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (m) => m.name.toLowerCase().includes(q) || m.family.toLowerCase().includes(q)
    );
  }
  if (family) {
    result = result.filter((m) => m.family === family);
  }
  if (paramRange) {
    result = result.filter((m) => {
      const b = m.parameterCountB;
      switch (paramRange) {
        case "tiny": return b < 1;
        case "small": return b >= 1 && b <= 8;
        case "medium": return b > 8 && b <= 32;
        case "large": return b > 32;
        default: return true;
      }
    });
  }
  if (quantBits) {
    result = result.filter((m) => m.quantizationBits === Number(quantBits));
  }
  return result;
}

interface ModelPageContentProps {
  initialData: PaginatedData<ModelListItem>;
}

export function ModelPageContent({ initialData }: ModelPageContentProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const [paramRange, setParamRange] = useState<string | null>(null);
  const [quantBits, setQuantBits] = useState<string | null>(null);

  const filtered = filterModels(initialData.items, search, family, paramRange, quantBits);

  const familyOptions = [
    { value: "Qwen", label: "Qwen" },
    { value: "Llama", label: "Llama" },
    { value: "Gemma", label: "Gemma" },
    { value: "Mistral", label: "Mistral" },
    { value: "DeepSeek", label: "DeepSeek" },
    { value: "Phi", label: "Phi" },
    { value: "Command R", label: "Command R" },
    { value: "Yi", label: "Yi" },
  ];

  const paramOptions = [
    { value: "tiny", label: "<1B" },
    { value: "small", label: "1B–8B" },
    { value: "medium", label: "8B–32B" },
    { value: "large", label: "32B+" },
  ];

  const quantOptions = [
    { value: "4", label: "Q4" },
    { value: "8", label: "Q8" },
    { value: "16", label: "FP16" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb segments={[{ label: t("nav.models") }]} />
      <PageHeader
        title={t("nav.models")}
        description={t("seo.models_description")}
      />

      {/* Filters */}
      <div className="space-y-3 mb-8">
        <SearchBar value={search} onChange={setSearch} placeholder={t("common.search")} />
        <div className="flex flex-wrap gap-4">
          <FilterBar options={familyOptions} selected={family} onSelect={setFamily} label={t("footer.models")} />
          <FilterBar options={paramOptions} selected={paramRange} onSelect={setParamRange} label={t("model.parameters")} />
          <FilterBar options={quantOptions} selected={quantBits} onSelect={setQuantBits} label={t("model.quantization")} />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {t("common.showing")} {filtered.length} {t("common.of")} {initialData.total} {t("common.results")}
        {search && ` — "${search}"`}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <ModelCardLink
              key={m.id}
              id={m.id}
              name={m.name}
              family={m.family}
              parameterCountB={m.parameterCountB}
              quantization={m.quantization}
              recommendedVramGb={m.recommendedVramGb}
              contextLength={m.contextLength}
              qualityScore={m.qualityScore}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">{t("common.no_results")}</p>
          <p className="text-sm mt-1">{t("common.empty_hint")}</p>
        </div>
      )}
    </main>
  );
}
