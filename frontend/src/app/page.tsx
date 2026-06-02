"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeroSection } from "@/components/hero-section";
import { ResultsSection } from "@/components/results-section";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useHardwareStore } from "@/stores/hardware-store";
import type { HardwareInput } from "@/types/hardware";

// Sensible default for first-time visitors (mid-range gaming PC)
const DEFAULT_HARDWARE: HardwareInput = {
  gpuName: "NVIDIA GeForce RTX 3060",
  ramGb: 16,
  cpuCores: 8,
  os: "Windows",
};

function HomeContent() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [hasDetected, setHasDetected] = useState(false);
  const hardwareInput = useHardwareStore((s) => s.input);
  const manualGpu = useHardwareStore((s) => s.manualGpu);
  const status = useHardwareStore((s) => s.status);
  const wasDetected = useRef(false);

  // On first detection, flip hasDetected so results become visible
  if (status === "detected" && !hasDetected) {
    setHasDetected(true);
  }

  // Build effective input: manual GPU > detected > default
  const effectiveInput = useMemo<HardwareInput>(() => {
    if (!hardwareInput) return DEFAULT_HARDWARE;
    const gpuName = manualGpu || hardwareInput.gpuName;
    return { ...hardwareInput, gpuName };
  }, [hardwareInput, manualGpu]);

  // Always fetch so results are ready immediately when revealed
  const { data, isLoading, isError, refetch } =
    useRecommendations(effectiveInput);

  // Reset scroll flag when re-scan starts
  if (status === "detecting") {
    wasDetected.current = false;
  }

  // Auto-scroll to results when detection completes
  useEffect(() => {
    if (status === "detected" && !wasDetected.current) {
      wasDetected.current = true;
      const t = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <main className="min-h-screen">
      <HeroSection />

      {/* Results — only visible after first detection. On refresh, hasDetected=false → hidden. */}
      {hasDetected && (
        <div ref={resultsRef} className="scroll-mt-20">
          <ResultsSection
            data={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
          />
        </div>
      )}
    </main>
  );
}

export default function Home() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <HomeContent />
    </QueryClientProvider>
  );
}
