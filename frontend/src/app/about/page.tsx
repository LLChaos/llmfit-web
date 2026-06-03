import type { Metadata } from "next";
import { ABOUT_META } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = ABOUT_META;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb segments={[{ label: "About Us" }]} />

      <PageHeader
        title="About LLMFit Web"
        description="Our mission is to become the standard reference for local LLM hardware compatibility."
        badge="About"
      />

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            LLMFit Web helps users find the best open-source large language
            models (LLMs) that can run on their personal hardware. We
            automatically detect your GPU, VRAM, and system specs, then match
            them against our curated database of models and GPU specifications
            to deliver personalized recommendations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Hardware Detection</strong> —
              Your browser detects your GPU and system specs using WebGL and
              browser APIs. All detection happens locally on your device.
            </li>
            <li>
              <strong className="text-foreground">GPU Mapping</strong> — We
              resolve your GPU name to a full specification including VRAM,
              compute performance, and memory bandwidth.
            </li>
            <li>
              <strong className="text-foreground">Model Filtering</strong> — We
              filter our model database to find models that fit within your
              available VRAM.
            </li>
            <li>
              <strong className="text-foreground">Scoring & Ranking</strong> —
              Each compatible model is scored across four dimensions: quality
              (40%), speed (25%), compatibility (20%), and context window
              (15%).
            </li>
            <li>
              <strong className="text-foreground">Recommendations</strong> —
              The top 10 models are presented with estimated performance
              metrics and upgrade suggestions.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">Data Sources</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our GPU specifications are sourced from the TechPowerUp GPU
            database. Model information is collected from HuggingFace, the
            leading open-source AI model repository. We regularly update our
            database to include new models and GPUs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            We aim to build the definitive &ldquo;Can I Run This LLM?&rdquo;
            platform — supporting 1000+ models and serving 100,000+ monthly
            active users. All architecture decisions are made with this scale
            in mind.
          </p>
        </section>

        {/* Cross-links */}
        <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Also see:</span>
          <a href="/contact" className="text-primary hover:underline">
            Contact Us
          </a>
          <span>·</span>
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          <span>·</span>
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>
          <span>·</span>
          <a href="/tools/recommend" className="text-primary hover:underline">
            Try the Hardware Tool
          </a>
        </div>
      </div>
    </div>
  );
}
