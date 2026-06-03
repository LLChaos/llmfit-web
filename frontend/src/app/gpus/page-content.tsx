"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { FilterBar } from "@/components/filter-bar";
import { GpuCardLink } from "@/components/gpu-card-link";
import { PageHeader } from "@/components/page-header";
import type { GpuListItem } from "@/types/hardware";
import type { PaginatedData } from "@/services/api-client";

const VENDOR_OPTIONS = [
  { value: "nvidia", label: "NVIDIA" },
  { value: "amd", label: "AMD" },
  { value: "apple", label: "Apple" },
  { value: "intel", label: "Intel" },
];

const TIER_OPTIONS = [
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid-Range" },
  { value: "high", label: "High-End" },
  { value: "enthusiast", label: "Enthusiast" },
];

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
  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  const allGpus = initialData.items;

  const filtered = filterGpus(allGpus, search, vendor, tier);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        title="GPU Database"
        description={`Explore ${initialData.total} GPU specifications across ${VENDOR_OPTIONS.length} vendors and ${TIER_OPTIONS.length} performance tiers. Find out which models can run on each GPU.`}
        badge="GPUs"
      />

      {/* Filters */}
      <div className="space-y-3 mb-8">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search GPUs by name..."
        />
        <div className="flex flex-wrap gap-4">
          <FilterBar
            options={VENDOR_OPTIONS}
            selected={vendor}
            onSelect={setVendor}
            label="Vendor"
          />
          <FilterBar
            options={TIER_OPTIONS}
            selected={tier}
            onSelect={setTier}
            label="Tier"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        Showing {filtered.length} of {initialData.total} GPUs
        {search && ` matching "${search}"`}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
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
          <p className="text-lg font-medium">No GPUs found</p>
          <p className="text-sm mt-1">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
}
