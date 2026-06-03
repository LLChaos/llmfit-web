import { cn } from "@/lib/utils";

export interface SpecRow {
  label: string;
  value: string | number;
  /** Optional unit displayed after the value */
  unit?: string;
  /** Optional descriptive hint */
  hint?: string;
}

interface SpecTableProps {
  rows: SpecRow[];
  className?: string;
}

export function SpecTable({ rows, className }: SpecTableProps) {
  return (
    <section className={className}>
      <h2 className="text-xl font-semibold mb-4">Specifications</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/50 last:border-b-0",
                  i % 2 === 0 && "bg-muted/20"
                )}
              >
                <td className="px-4 py-2.5 text-sm font-medium text-foreground w-1/3 sm:w-1/4">
                  {row.label}
                </td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">
                  {row.value}
                  {row.unit && (
                    <span className="text-xs text-muted-foreground/70 ml-1">
                      {row.unit}
                    </span>
                  )}
                  {row.hint && (
                    <span className="block text-xs text-muted-foreground/60 mt-0.5">
                      {row.hint}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
