"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ChevronsUpDown } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useTranslation } from "@/hooks/use-translation";

interface GpuOption {
  name: string;
  vendor: string;
  vram_gb: number;
  tier: string;
}

interface GpuSelectorProps {
  detectedGpu: string;
  onChange: (gpuName: string) => void;
}

export function GpuSelector({ detectedGpu, onChange }: GpuSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GpuOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 1) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await apiClient.searchGpus(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (gpu: GpuOption) => {
    onChange(gpu.name);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Detected GPU badge */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {detectedGpu === "Unknown GPU"
            ? t("hardware.gpu_detected_none")
            : detectedGpu}
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ChevronsUpDown className="size-3" />
          {t("hardware.not_your_gpu")}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border bg-card p-2 shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (!val.trim()) setResults([]);
              }}
              placeholder={t("hardware.search_gpu_placeholder")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {query && (
              <button type="button" onClick={handleClear}>
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="mt-1 max-h-48 overflow-y-auto">
            {isSearching && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                {t("common.searching")}
              </p>
            )}
            {!isSearching && query.length > 0 && results.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                {t("common.no_results")}
              </p>
            )}
            {results.map((gpu) => (
              <button
                key={gpu.name}
                type="button"
                onClick={() => handleSelect(gpu)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium truncate">{gpu.name}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                  {gpu.vram_gb}GB · {gpu.tier}
                </span>
              </button>
            ))}
          </div>

          {/* Hint to type */}
          {query.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {t("hardware.type_to_search")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
