"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { ChevronDown, Info } from "lucide-react";

interface ScoringExplanationProps {
  className?: string;
}

export function ScoringExplanation({ className }: ScoringExplanationProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("rounded-lg border border-border/60 bg-card", className)}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
      >
        <span className="inline-flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          {t("scoring.title")}
          <span className="text-xs text-muted-foreground">
            （{t("scoring.formula_short")}）
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-border/40 px-4 pb-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: "quality" as const, color: "bg-blue-500", weight: "40%" },
                { key: "speed" as const, color: "bg-green-500", weight: "25%" },
                { key: "compatibility" as const, color: "bg-amber-500", weight: "20%" },
                { key: "context" as const, color: "bg-purple-500", weight: "15%" },
              ] as const
            ).map((dim) => (
              <div key={dim.key} className="flex gap-3">
                {/* Color swatch + weight */}
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <span className={cn("h-3 w-10 rounded-full", dim.color)} />
                  <span className="text-xs font-mono font-medium tabular-nums text-muted-foreground">
                    {dim.weight}
                  </span>
                </div>
                {/* Description */}
                <div>
                  <p className="text-sm font-medium">
                    {t(`scoring.${dim.key}_label`)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {t(`scoring.${dim.key}_desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Formula visual */}
          <div className="mt-4 rounded-md bg-muted/50 px-3 py-2.5">
            <p className="text-center font-mono text-xs text-muted-foreground">
              {t("scoring.formula_full")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
