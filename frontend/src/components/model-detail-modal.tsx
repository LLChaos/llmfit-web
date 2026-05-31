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
import { TokenAnimation } from "@/components/token-animation";
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-2xl ring-0 sm:max-w-6xl dark:border-gray-700 dark:bg-gray-900">
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
          <div className="space-y-6">
            {/* Model name + family */}
            <div>
              <h3 className="text-xl font-semibold">{detail.name}</h3>
              <p className="text-sm text-muted-foreground">{detail.family}</p>
            </div>

            {/* Specs grid — 3 columns on wide screens */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
              <DetailRow
                label={t("model.parameters")}
                value={`${detail.parameterCountB}B`}
              />
              <DetailRow
                label={t("model.quantization")}
                value={`${detail.quantization} (${detail.quantizationBits}${t("model.bit_unit")})`}
              />
              <DetailRow
                label={t("model.vram_required")}
                value={`${detail.recommendedVramGb} GB (${t("model.vram_min")} ${detail.minVramGb} GB)`}
              />
              <DetailRow
                label={t("model.context_length")}
                value={detail.contextLength.toLocaleString()}
              />
              <DetailRow label={t("model.hidden_dim")} value={String(detail.hiddenDim)} />
              <DetailRow label={t("model.layers")} value={String(detail.numLayers)} />
              <DetailRow
                label={t("model.quality_score")}
                value={`${detail.qualityScore}/100`}
              />
            </div>

            {/* Token animation — full width */}
            {selectedModel && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("model.performance_estimate")}
                </p>
                <TokenAnimation
                  tokensPerSec={Math.round(selectedModel.estimatedTokensPerSec)}
                />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    {t("model.vram_label")}:{" "}
                    <span className="font-medium text-foreground">{selectedModel.estimatedVramGb} GB</span>
                  </span>
                </div>
              </div>
            )}

            {/* Bottom: action buttons */}
            <div className="flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={detail.downloadUrl} target="_blank" rel="noopener noreferrer" />}
              >
                <Download className="mr-1 h-4 w-4" />
                {t("model.download")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
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
