"use client";

import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  label?: string;
  className?: string;
}

export function FilterBar({
  options,
  selected,
  onSelect,
  label,
  className,
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label && (
        <span className="text-xs font-medium text-muted-foreground mr-1">
          {label}:
        </span>
      )}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "px-3 py-1 rounded-full text-xs font-medium transition-all border cursor-pointer",
          selected === null
            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm ring-1 ring-primary/20"
            : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
        )}
      >
        {t("common.all")}
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(selected === opt.value ? null : opt.value)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all border cursor-pointer",
            selected === opt.value
              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm ring-1 ring-primary/20"
              : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
