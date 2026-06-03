"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation, type TranslationKey } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHardwareStore } from "@/stores/hardware-store";
import { InlineSelect } from "@/components/inline-select";
import { apiClient } from "@/services/api-client";
import { cn } from "@/lib/utils";
import type { HardwareInfo } from "@/types/hardware";
import {
  Monitor,
  Cpu,
  HardDrive,
  Microchip,
  Zap,
  Layers,
  Search,
  X,
} from "lucide-react";

const TIER_KEY: Record<string, string> = {
  entry: "hardware.tier.entry",
  mid: "hardware.tier.mid",
  high: "hardware.tier.high",
  enthusiast: "hardware.tier.enthusiast",
};

const VRAM_OPTIONS = [4, 6, 8, 12, 16, 20, 24, 32, 48, 80];
const RAM_OPTIONS = [4, 8, 12, 16, 24, 32, 48, 64, 128];

// ── Inline GPU search ────────────────────────────────────────────

interface GpuOption {
  name: string;
  vendor: string;
  vram_gb: number;
  tier: string;
}

function GpuSearchDropdown({
  currentGpu,
  onSelect,
  onClose,
}: {
  currentGpu: string;
  onSelect: (gpu: GpuOption) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GpuOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
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

  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border bg-popover p-2 shadow-lg">
      {/* Search input */}
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("hardware.search_gpu_placeholder")}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")}>
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
            onClick={() => onSelect(gpu)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          >
            <span className="font-medium truncate">{gpu.name}</span>
            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
              {gpu.vram_gb}GB &middot; {gpu.tier}
            </span>
          </button>
        ))}
      </div>

      {/* Current GPU quick-reset */}
      {currentGpu && (
        <>
          <div className="my-1 border-t border-border/60" />
          <button
            type="button"
            onClick={() => {
              onSelect({ name: currentGpu, vendor: "", vram_gb: 0, tier: "" });
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            <span>
              {t("hardware.not_your_gpu")}{" "}
              <span className="font-medium text-foreground">{currentGpu}</span>
            </span>
          </button>
        </>
      )}

      {/* Hint */}
      {query.length === 0 && (
        <p className="px-2 pt-2 text-center text-xs text-muted-foreground">
          {t("hardware.type_to_search")}
        </p>
      )}
    </div>
  );
}

// ── Main card ────────────────────────────────────────────────────

interface HardwareCardProps {
  hardware: HardwareInfo | null;
  isLoading: boolean;
}

export function HardwareCard({ hardware, isLoading }: HardwareCardProps) {
  const { t } = useTranslation();

  // Front-end overrides (user-selected values)
  const detectedInput = useHardwareStore((s) => s.input);
  const manualGpu = useHardwareStore((s) => s.manualGpu);
  const manualVram = useHardwareStore((s) => s.manualVram);
  const manualRam = useHardwareStore((s) => s.manualRam);
  const setManualGpu = useHardwareStore((s) => s.setManualGpu);
  const setManualVram = useHardwareStore((s) => s.setManualVram);
  const setManualRam = useHardwareStore((s) => s.setManualRam);

  // GPU search dropdown state
  const [gpuSearchOpen, setGpuSearchOpen] = useState(false);
  const gpuFieldRef = useRef<HTMLDivElement>(null);

  // Close GPU search on outside click
  useEffect(() => {
    if (!gpuSearchOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        gpuFieldRef.current &&
        !gpuFieldRef.current.contains(e.target as Node)
      ) {
        setGpuSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [gpuSearchOpen]);

  const handleGpuSelect = useCallback(
    (gpu: GpuOption) => {
      setManualGpu(gpu.name);
      setGpuSearchOpen(false);
    },
    [setManualGpu],
  );

  // ── Effective display values ──────────────────────────────────

  const frontendGpu = manualGpu || detectedInput?.gpuName || "";

  const display: HardwareInfo | null = hardware
    ? {
        ...hardware,
        gpuName: frontendGpu || hardware.gpuName,
        vramGb: manualVram ?? hardware.vramGb,
        ramGb: manualRam ?? hardware.ramGb,
      }
    : detectedInput
      ? {
          gpuName: detectedInput.gpuName,
          vramGb: manualVram ?? 0,
          gpuTier: "entry",
          ramGb: manualRam ?? detectedInput.ramGb,
          cpuCores: detectedInput.cpuCores,
          os: detectedInput.os,
        }
      : null;

  // ── Loading skeleton ──────────────────────────────────────────

  if (isLoading && !detectedInput) {
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

  const placeholder = !display;
  const gpuName = display?.gpuName ?? "—";
  const effectiveVram = display ? display.vramGb : 0;
  const effectiveRam = display ? display.ramGb : 0;
  const cpuText = display ? `${display.cpuCores} ${t("hardware.cpu_unit")}` : "—";
  const osText = display?.os ?? "—";
  const tierRaw = display ? (TIER_KEY[display.gpuTier] ?? display.gpuTier) : "—";
  const tierText =
    display && effectiveVram > 0
      ? t(tierRaw as TranslationKey)
      : "—";

  return (
    <Card className={cn("w-full", placeholder && "opacity-50")}>
      <CardHeader>
        <CardTitle className="text-lg">{t("hardware.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* ── GPU (editable: search dropdown) ───────────────── */}
          <div
            ref={gpuFieldRef}
            className="relative flex flex-col gap-1 rounded-lg border p-3"
          >
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t("hardware.gpu")}
            </span>
            {placeholder ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <button
                type="button"
                onClick={() => setGpuSearchOpen(!gpuSearchOpen)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md -ml-1 px-1.5 py-0.5 text-left text-sm font-medium truncate",
                  "hover:bg-accent transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
              >
                <span className="truncate">{gpuName}</span>
                <span className="ml-0.5 shrink-0 text-[0.6rem] text-muted-foreground">
                  &#x25BC;
                </span>
              </button>
            )}
            {gpuSearchOpen && (
              <GpuSearchDropdown
                currentGpu={gpuName}
                onSelect={handleGpuSelect}
                onClose={() => setGpuSearchOpen(false)}
              />
            )}
          </div>

          {/* ── VRAM (editable: InlineSelect) ─────────────────── */}
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t("hardware.vram")}
            </span>
            {placeholder ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <InlineSelect
                value={manualVram}
                options={VRAM_OPTIONS}
                unit="GB"
                onChange={setManualVram}
                autoLabel={
                  effectiveVram > 0
                    ? `${effectiveVram} GB`
                    : t("hardware.gpu_detected_none")
                }
              />
            )}
          </div>

          {/* ── RAM (editable: InlineSelect) ──────────────────── */}
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t("hardware.ram")}
            </span>
            {placeholder ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <InlineSelect
                value={manualRam}
                options={RAM_OPTIONS}
                unit="GB"
                onChange={setManualRam}
                autoLabel={
                  effectiveRam > 0
                    ? `${effectiveRam} GB`
                    : t("hardware.gpu_detected_none")
                }
              />
            )}
          </div>

          {/* ── CPU threads (read-only) ───────────────────────── */}
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t("hardware.cpu")}
            </span>
            <span className="text-sm font-medium truncate">
              {cpuText}
            </span>
          </div>

          {/* ── OS (read-only) ────────────────────────────────── */}
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <Microchip className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t("hardware.os")}
            </span>
            <span className="text-sm font-medium truncate">
              {osText}
            </span>
          </div>

          {/* ── Tier (read-only) ──────────────────────────────── */}
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t("hardware.tier")}
            </span>
            <span className="text-sm font-medium truncate">
              {tierText}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
