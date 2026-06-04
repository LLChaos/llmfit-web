"use client";

import { useTranslation } from "@/hooks/use-translation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import type { RecommendedModel } from "@/types/recommendation";

interface ScoreBarChartProps {
  models: RecommendedModel[];
}

/** Map score 0–100 → green → lime → yellow → orange → red gradient */
function scoreToColor(score: number): string {
  if (score >= 85) return "#22c55e"; // green-500
  if (score >= 70) return "#84cc16"; // lime-500
  if (score >= 55) return "#eab308"; // yellow-500
  if (score >= 40) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

function truncateName(name: string, maxLen = 24): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + "…";
}

export function ScoreBarChart({ models }: ScoreBarChartProps) {
  const { t } = useTranslation();

  const top10 = models.slice(0, 10);

  if (top10.length === 0) return null;

  const data = top10.map((m) => ({
    name: `${m.rank}. ${truncateName(m.modelId)}`,
    fullName: m.modelId,
    score: m.scores.total,
  }));

  return (
    <div className="rounded-xl border bg-[hsl(var(--card))] p-5">
      <h3 className="mb-4 text-lg font-semibold">
        {"📊 "}
        {t("more_recommendations.score_chart_title")}
      </h3>

      <ResponsiveContainer
        width="100%"
        height={Math.max(data.length * 44 + 20, 200)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
            width={180}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value) => [
              typeof value === "number" ? value.toFixed(0) : String(value),
              t("recommendation.sort_total"),
            ]}
          />
          <Bar
            dataKey="score"
            radius={[0, 6, 6, 0]}
            barSize={24}
            animationDuration={600}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={scoreToColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
