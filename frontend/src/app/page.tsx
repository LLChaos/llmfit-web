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

  const { data, isLoading, isError, refetch } = useRecommendations(
    shouldFetch ? hardwareInput : null,
  );

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
