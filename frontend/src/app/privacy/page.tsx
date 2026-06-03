import type { Metadata } from "next";
import { PRIVACY_META } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = PRIVACY_META;

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb segments={[{ label: "Privacy Policy" }]} />

      <PageHeader
        title="Privacy Policy"
        description="Last updated: June 4, 2025"
        badge="Legal"
      />

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">1. Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            LLMFit Web (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
            &ldquo;us&rdquo;) is committed to protecting your privacy. This
            policy explains how we handle information when you visit our
            website and use our hardware detection and model recommendation
            tools.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            2. Information We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Hardware Detection:</strong> All hardware detection
            (GPU name, VRAM, RAM, CPU cores, OS) is performed locally in your
            browser using WebGL and browser APIs. This data is never uploaded
            to our servers.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong>Model Recommendations:</strong> When you request model
            recommendations, your hardware profile is sent to our API server
            for processing. We do not log or store individual hardware profiles
            — they are processed in-memory and discarded after the response is
            generated.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            <strong>Usage Data:</strong> We may collect anonymous usage
            statistics (page views, feature usage) through standard web
            analytics. This data does not identify individual users.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">3. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use a single localStorage entry to remember your theme
            preference (light/dark mode). This is not a tracking cookie and
            does not contain personal information. We do not use third-party
            tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            4. Third-Party Services
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Our website may load model and GPU data from our backend API. We do
            not share your information with third-party advertising networks or
            data brokers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            5. Data Security
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            All communication between your browser and our servers is encrypted
            via HTTPS. Our backend services are configured with minimal data
            retention — hardware profiles are processed transiently and not
            persisted.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">6. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            Since we do not collect or store personal data, there is no
            personal data to access, correct, or delete. If you have any
            concerns about privacy, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">7. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy, please contact us
            at{" "}
            <a
              href="mailto:privacy@example.com"
              className="text-primary hover:underline"
            >
              privacy@example.com
            </a>
            .
          </p>
        </section>

        {/* Cross-links */}
        <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Also see:</span>
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>
          <span>·</span>
          <a href="/about" className="text-primary hover:underline">
            About Us
          </a>
          <span>·</span>
          <a href="/contact" className="text-primary hover:underline">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
