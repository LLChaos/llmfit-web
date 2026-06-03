import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  /** Optional badge text shown above the title */
  badge?: string;
}

export function PageHeader({
  title,
  description,
  className,
  badge,
}: PageHeaderProps) {
  return (
    <header className={cn("py-8 sm:py-12", className)}>
      {badge && (
        <span className="inline-block text-xs font-medium text-primary uppercase tracking-wider mb-3">
          {badge}
        </span>
      )}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </header>
  );
}
