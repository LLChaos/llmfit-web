"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchBar } from "@/components/search-bar";
import { FilterBar } from "@/components/filter-bar";
import { ModelCardLink } from "@/components/model-card-link";
import { PageHeader } from "@/components/page-header";
import type { ModelListItem } from "@/types/model";
import type { PaginatedData } from "@/services/api-client";

const FAMILY_OPTIONS = [
  { value: "Qwen", label: "Qwen" },
  { value: "Llama", label: "Llama" },
  { value: "Gemma", label: "Gemma" },
  { value: "Mistral", label: "Mistral" },
  { value: "DeepSeek", label: "DeepSeek" },
  { value: "Phi", label: "Phi" },
  { value: "Command R", label: "Command R" },
  { value: "Yi", label: "Yi" },
];

const PARAM_OPTIONS = [
  { value: "tiny", label: "&lt;1B" },
  { value: "small", label: "1B–8B" },
  { value: "medium", label: "8B–32B" },
  { value: "large", label: "32B+" },
];

const QUANT_OPTIONS = [
  { value: "4", label: "Q4" },
  { value: "8", label: "Q8" },
  { value: "16", label: "FP16" },
];

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
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q)
    );
  }
  if (family) {
    result = result.filter((m) => m.family === family);
  }
  if (paramRange) {
    result = result.filter((m) => {
      const b = m.parameterCountB;
      switch (paramRange) {
        case "tiny":
          return b < 1;
        case "small":
          return b >= 1 && b <= 8;
        case "medium":
          return b > 8 && b <= 32;
        case "large":
          return b > 32;
        default:
          return true;
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
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const [paramRange, setParamRange] = useState<string | null>(null);
  const [quantBits, setQuantBits] = useState<string | null>(null);

  const allModels = initialData.items;

  const filtered = filterModels(allModels, search, family, paramRange, quantBits);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        title="Model Library"
        description={`Browse ${initialData.total} open-source LLM variants across ${FAMILY_OPTIONS.length} model families. Filter by family, parameter size, quantization, and VRAM requirements.`}
        badge="Models"
      />

      {/* Filters */}
      <div className="space-y-3 mb-8">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search models by name or family..."
        />
        <div className="flex flex-wrap gap-4">
          <FilterBar
            options={FAMILY_OPTIONS}
            selected={family}
            onSelect={setFamily}
            label="Family"
          />
          <FilterBar
            options={PARAM_OPTIONS}
            selected={paramRange}
            onSelect={setParamRange}
            label="Size"
          />
          <FilterBar
            options={QUANT_OPTIONS}
            selected={quantBits}
            onSelect={setQuantBits}
            label="Quant"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        Showing {filtered.length} of {initialData.total} models
        {search && ` matching "${search}"`}
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
          <p className="text-lg font-medium">No models found</p>
          <p className="text-sm mt-1">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
}
