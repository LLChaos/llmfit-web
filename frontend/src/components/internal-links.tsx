import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface LinkItem {
  href: string;
  label: string;
  external?: boolean;
}

interface InternalLinksProps {
  title?: string;
  links: LinkItem[];
  className?: string;
}

export function InternalLinks({
  title = "See Also",
  links,
  className,
}: InternalLinksProps) {
  if (links.length === 0) return null;

  return (
    <div
      className={cn(
        "border-t border-border pt-6",
        className
      )}
    >
      <span className="text-sm font-medium text-muted-foreground">
        {title}:
      </span>
      <div className="mt-2 flex flex-wrap gap-3">
        {links.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {link.label}
              <ArrowRight className="h-3 w-3" />
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {link.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )
        )}
      </div>
    </div>
  );
}
