import type { Metadata } from "next";
import { TERMS_META } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = TERMS_META;

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb segments={[{ label: "Terms of Service" }]} />

      <PageHeader
        title="Terms of Service"
        description="Last updated: June 4, 2025"
        badge="Legal"
      />

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            1. Acceptance of Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing and using LLMFit Web (&ldquo;the Service&rdquo;), you
            agree to be bound by these Terms of Service. If you do not agree,
            please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            2. Service Description
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            LLMFit Web provides a hardware compatibility checking and model
            recommendation service for local large language model deployment.
            The Service detects your system hardware and suggests compatible
            open-source AI models.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">3. Disclaimer</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>
              The Service is provided for informational purposes only.
            </strong>{" "}
            Model recommendations are based on estimated hardware requirements
            and publicly available benchmark data. Actual performance may vary
            depending on your specific system configuration, driver versions,
            and other factors.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            We make no guarantees that a recommended model will run on your
            hardware, or that it will perform as estimated. Users should verify
            model requirements independently before downloading and running
            models.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            4. Intellectual Property
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The LLMFit Web platform code, website design, and original content
            are our intellectual property. The models recommended by our
            Service are third-party open-source projects and are subject to
            their own licenses. We do not claim ownership over any recommended
            model.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            5. User Obligations
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree not to misuse the Service, including attempting to
            disrupt, overload, or gain unauthorized access to our systems. You
            are responsible for ensuring that any models you download and run
            comply with their respective licenses and applicable laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            6. Limitation of Liability
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            To the fullest extent permitted by law, LLMFit Web shall not be
            liable for any damages arising from your use of the Service,
            including but not limited to: hardware damage, data loss, or issues
            caused by running recommended models on your system.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">
            7. Changes to Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to modify these Terms at any time. Updated
            terms will be posted on this page with a revised date. Continued
            use of the Service after changes constitutes acceptance of the new
            Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-3">8. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these Terms, please contact us at{" "}
            <a
              href="mailto:legal@example.com"
              className="text-primary hover:underline"
            >
              legal@example.com
            </a>
            .
          </p>
        </section>

        {/* Cross-links */}
        <div className="border-t border-border pt-6 mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Also see:</span>
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
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
