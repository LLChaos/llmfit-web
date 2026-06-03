import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProsConsListProps {
  pros: string[];
  cons: string[];
  className?: string;
}

export function ProsConsList({ pros, cons, className }: ProsConsListProps) {
  return (
    <section className={cn("grid gap-6 sm:grid-cols-2", className)}>
      {/* Pros */}
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10 p-5">
        <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-1.5">
          <Check className="h-4 w-4" />
          Strengths
        </h3>
        <ul className="space-y-2">
          {pros.map((pro, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-green-500" />
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10 p-5">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-1.5">
          <X className="h-4 w-4" />
          Limitations
        </h3>
        <ul className="space-y-2">
          {cons.map((con, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <X className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-red-500" />
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
