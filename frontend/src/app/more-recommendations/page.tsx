import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { MoreRecommendationsPageContent } from "./page-content";

export const metadata: Metadata = constructMetadata({
  title: "更多推荐 — LLMFit Web",
  description:
    "自由调整 GPU、显存、内存配置，发现所有适合你硬件条件的开源大语言模型，并按综合评分排序。",
  path: "/more-recommendations",
});

export default function MoreRecommendationsPage() {
  return <MoreRecommendationsPageContent />;
}
