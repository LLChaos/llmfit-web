"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SearchBar } from "@/components/search-bar";
import { FilterBar } from "@/components/filter-bar";
import { ModelCardLink } from "@/components/model-card-link";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import type { ModelListItem } from "@/types/model";
import type { PaginatedData } from "@/services/api-client";

const ITEMS_PER_PAGE = 24;

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
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => filterModels(initialData.items, search, family, paramRange, quantBits),
    [initialData.items, search, family, paramRange, quantBits]
  );

  // Reset to page 1 when filters change (via onChange callbacks below)
  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleFamilyChange = (value: string | null) => { setFamily(value); setPage(1); };
  const handleParamRangeChange = (value: string | null) => { setParamRange(value); setPage(1); };
  const handleQuantBitsChange = (value: string | null) => { setQuantBits(value); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pagedItems = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
        <SearchBar value={search} onChange={handleSearchChange} placeholder={t("common.search")} />
        <div className="flex flex-wrap gap-4">
          <FilterBar options={familyOptions} selected={family} onSelect={handleFamilyChange} label={t("footer.models")} />
          <FilterBar options={paramOptions} selected={paramRange} onSelect={handleParamRangeChange} label={t("model.parameters")} />
          <FilterBar options={quantOptions} selected={quantBits} onSelect={handleQuantBitsChange} label={t("model.quantization")} />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {t("common.showing")} {pagedItems.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} {t("common.of")} {filtered.length} {t("common.results")}
        {search && ` — "${search}"`}
      </p>

      {/* Grid */}
      {pagedItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pagedItems.map((m) => (
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

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-8"
      />
    </main>
  );
}
