import type { ModelListItem } from "@/types/model";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Zap, Layers } from "lucide-react";
import Link from "next/link";

interface ModelCardFeaturedProps {
  model: ModelListItem;
}

export function ModelCardFeatured({ model }: ModelCardFeaturedProps) {
  // Compact variant of ModelCard: shows name, family badge, params, VRAM, quality score
  return (
    <Link href={`/models/${model.id}`} className="group block">
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40">
        <CardContent className="flex flex-col gap-3 p-5">
          {/* Name + quality badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary">
              {model.name}
            </h3>
            <Badge
              variant="secondary"
              className="shrink-0 text-xs"
            >
              {model.qualityScore}分
            </Badge>
          </div>

          {/* Family tag */}
          <Badge variant="outline" className="w-fit text-[11px]">
            {model.family}
          </Badge>

          {/* Specs row */}
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              {model.parameterCountB}B
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {model.recommendedVramGb}GB VRAM
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {(model.contextLength / 1024).toFixed(0)}K ctx
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
