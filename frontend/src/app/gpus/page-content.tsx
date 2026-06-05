"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SearchBar } from "@/components/search-bar";
import { FilterBar } from "@/components/filter-bar";
import { GpuCardLink } from "@/components/gpu-card-link";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import type { GpuListItem } from "@/types/hardware";
import type { PaginatedData } from "@/services/api-client";

const ITEMS_PER_PAGE = 24;

function filterGpus(
  gpus: GpuListItem[],
  search: string,
  vendor: string | null,
  tier: string | null
): GpuListItem[] {
  let result = gpus;
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter((g) => g.name.toLowerCase().includes(q));
  }
  if (vendor) {
    result = result.filter((g) => g.vendor === vendor);
  }
  if (tier) {
    result = result.filter((g) => g.tier === tier);
  }
  return result;
}

interface GpuPageContentProps {
  initialData: PaginatedData<GpuListItem>;
}

export function GpuPageContent({ initialData }: GpuPageContentProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => filterGpus(initialData.items, search, vendor, tier),
    [initialData.items, search, vendor, tier]
  );

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, vendor, tier]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pagedItems = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const vendorOptions = [
    { value: "nvidia", label: "NVIDIA" },
    { value: "amd", label: "AMD" },
    { value: "apple", label: "Apple" },
    { value: "intel", label: "Intel" },
  ];

  const tierOptions = [
    { value: "entry", label: t("hardware.tier.entry") },
    { value: "mid", label: t("hardware.tier.mid") },
    { value: "high", label: t("hardware.tier.high") },
    { value: "enthusiast", label: t("hardware.tier.enthusiast") },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb segments={[{ label: t("nav.gpus") }]} />
      <PageHeader
        title={t("nav.gpus")}
        description={t("seo.gpus_description")}
      />

      {/* Filters */}
      <div className="space-y-3 mb-8">
        <SearchBar value={search} onChange={setSearch} placeholder={t("common.search")} />
        <div className="flex flex-wrap gap-4">
          <FilterBar options={vendorOptions} selected={vendor} onSelect={setVendor} label={t("footer.gpus")} />
          <FilterBar options={tierOptions} selected={tier} onSelect={setTier} label={t("common.tier")} />
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
          {pagedItems.map((g) => (
            <GpuCardLink
              key={g.id}
              id={g.id}
              name={g.name}
              vendor={g.vendor}
              vramGb={g.vramGb}
              tier={g.tier}
              benchmarkScore={g.benchmarkScore}
              flopsTflops={g.flopsTflops}
              memoryBandwidthGbS={g.memoryBandwidthGbS}
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
