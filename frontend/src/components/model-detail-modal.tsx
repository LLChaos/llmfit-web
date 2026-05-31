"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { useRecommendationStore } from "@/stores/recommendation-store";
import { apiClient } from "@/services/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

export function ModelDetailModal() {
  const { t } = useTranslation();
  const { selectedModel, selectModel } = useRecommendationStore();

  const { data: detail, isLoading } = useQuery({
    queryKey: ["model-detail", selectedModel?.modelId],
    queryFn: () => apiClient.getModel(selectedModel!.modelId),
    enabled: !!selectedModel,
  });

  return (
    <Dialog
      open={!!selectedModel}
      onOpenChange={(open) => !open && selectModel(null)}
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("model.detail_title")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-5 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{detail.name}</h3>
              <p className="text-sm text-muted-foreground">{detail.family}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <DetailRow
                label={t("model.parameters")}
                value={`${detail.parameterCountB}B`}
              />
              <DetailRow
                label="Quantization"
                value={`${detail.quantization} (${detail.quantizationBits}-bit)`}
              />
              <DetailRow
                label={t("model.vram_required")}
                value={`${detail.recommendedVramGb} GB (min ${detail.minVramGb} GB)`}
              />
              <DetailRow
                label={t("model.context_length")}
                value={detail.contextLength.toLocaleString()}
              />
              <DetailRow label="Hidden Dim" value={String(detail.hiddenDim)} />
              <DetailRow label="Layers" value={String(detail.numLayers)} />
              <DetailRow
                label="Quality Score"
                value={`${detail.qualityScore}/100`}
              />
            </div>

            {selectedModel && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Estimated Performance
                </p>
                <div className="flex gap-4 text-sm">
                  <span>
                    {t("model.estimated_speed")}:{" "}
                    <strong>{selectedModel.estimatedTokensPerSec} tok/s</strong>
                  </span>
                  <span>
                    VRAM: <strong>{selectedModel.estimatedVramGb} GB</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<a href={detail.downloadUrl} target="_blank" rel="noopener noreferrer" />}
              >
                <Download className="mr-1 h-4 w-4" />
                {t("model.download")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                render={<a href={`https://huggingface.co/${detail.huggingfaceRepo}`} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                {t("model.view_on_hf")}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}
