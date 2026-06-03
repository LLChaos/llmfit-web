import type { Metadata } from "next";
import { HOME_META } from "@/lib/seo";
import { HomeClient } from "@/components/home-client";
import { FeaturedModelsSection } from "@/components/featured-models-section";
import { FeaturedGpusSection } from "@/components/featured-gpus-section";
import { HomeNewsSection } from "@/components/home-news-section";
import { HomeCtaSection } from "@/components/home-cta-section";

export const metadata: Metadata = HOME_META;

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero + Terminal + Detection + Results (client-side) */}
      <HomeClient />

      {/* 🔥 Featured Models — server-rendered with ISR 30min */}
      <FeaturedModelsSection />

      {/* 🖥️ Featured GPUs — top 3 horizontal cards */}
      <FeaturedGpusSection />

      {/* 📰 Latest News — 3 articles */}
      <HomeNewsSection />

      {/* 🚀 Bottom CTA */}
      <HomeCtaSection />
    </main>
  );
}

