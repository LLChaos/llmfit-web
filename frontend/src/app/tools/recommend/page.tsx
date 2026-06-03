import type { Metadata } from "next";
import { TOOLS_META } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";

export const metadata: Metadata = TOOLS_META;

// The actual tool is client-rendered (needs WebGL API)
// We import it dynamically to avoid SSR issues
import { RecommendTool } from "./recommend-tool";

export default function RecommendPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb segments={[{ label: "Hardware Check" }]} />
      <RecommendTool />
    </div>
  );
}
