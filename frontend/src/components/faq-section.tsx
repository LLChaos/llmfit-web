"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FaqItem[];
  className?: string;
}

export function FAQSection({ items, className }: FAQSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="text-xl font-semibold mb-4">
        FAQ.
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <FaqAccordion key={i} question={item.question} answer={item.answer} />
        ))}
      </div>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}

function FaqAccordion({ question, answer }: FaqItem) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-muted/30 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed border-t border-border/50">
          {answer}
        </div>
      )}
    </div>
  );
}
