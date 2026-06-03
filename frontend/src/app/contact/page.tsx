import type { Metadata } from "next";
import { CONTACT_META } from "@/lib/seo";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";
import { Mail, MessageSquare, Clock } from "lucide-react";

export const metadata: Metadata = CONTACT_META;

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb segments={[{ label: "Contact Us" }]} />

      <PageHeader
        title="Contact Us"
        description="Have questions, feedback, or suggestions? We'd love to hear from you."
        badge="Contact"
      />

      <div className="space-y-10">
        {/* Contact methods */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <Mail className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Email</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <a
                href="mailto:contact@example.com"
                className="text-primary hover:underline break-all"
              >
                contact@example.com
              </a>
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <MessageSquare className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">GitHub</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Found a bug? Open an issue on our GitHub repository.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <Clock className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Response Time</h3>
            <p className="text-xs text-muted-foreground mt-1">
              We typically respond within 1&ndash;2 business days.
            </p>
          </div>
        </div>

        {/* Contact form */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Send Us a Message</h2>
          <ContactForm />
        </section>

        {/* FAQ section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How accurate are the hardware detection results?",
                a: "Browser-based GPU detection uses WebGL and can identify most dedicated GPUs. Some integrated GPUs or very new models may not be detected correctly. You can manually select your GPU from the search dropdown on the Hardware Check page.",
              },
              {
                q: "Do you store my hardware information?",
                a: "No. All hardware detection happens locally in your browser. We do not upload or store your system specifications. See our Privacy Policy for details.",
              },
              {
                q: "Can I request a model or GPU to be added?",
                a: "Yes! Send us a message with the model or GPU details, and we will review it for inclusion in our database.",
              },
              {
                q: "Why is a particular model not recommended for my GPU?",
                a: "Our recommendation engine considers VRAM, estimated performance, and quality scores. If a model's VRAM requirement exceeds your GPU's capacity, it's filtered out. You can manually adjust your VRAM on the Hardware Check page to explore other options.",
              },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-medium text-sm">{faq.q}</h3>
                <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links to other pages */}
        <div className="border-t border-border pt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Also see:</span>
          <a href="/about" className="text-primary hover:underline">
            About Us
          </a>
          <span>·</span>
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          <span>·</span>
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
