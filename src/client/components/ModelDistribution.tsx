import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { DashboardRow } from "../types";
import { formatNumber, formatDateShort } from "../utils";

interface ModelDistributionProps {
  modelRows: DashboardRow[];
  rows: DashboardRow[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e0e7ff", "#818cf8", "#7c3aed"];

export function ModelDistribution({ modelRows, rows }: ModelDistributionProps) {
  const { t } = useTranslation();

  if (modelRows.length === 0) return null;

  const isHourly = rows.length > 0 && rows[0].date.includes(" ");
  const dateLen = rows.length > 0 ? rows[0].date.length : 10;
  const periodLabel = isHourly ? t("period.hourly") : dateLen === 4 ? t("period.yearly") : dateLen === 7 ? t("period.monthly") : t("period.daily");

  const byDateModel = new Map<string, Map<string, number>>();
  const allModels = new Set<string>();

  for (const r of modelRows) {
    const date = r.date.slice(0, dateLen);
    const model = r.model ?? "unknown";
    allModels.add(model);

    if (!byDateModel.has(date)) byDateModel.set(date, new Map());
    const modelMap = byDateModel.get(date)!;
    modelMap.set(model, (modelMap.get(model) ?? 0) + r.totalTokens);
  }

  const models = [...allModels].sort();
  const data = [...byDateModel.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, modelMap]) => {
      const entry: Record<string, string | number> = { date };
      for (const m of models) {
        entry[m] = modelMap.get(m) ?? 0;
      }
      return entry;
    });

  return (
    <div className="chart-card">
      <h3>{t("chart.modelUsage", { period: periodLabel })}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            tickFormatter={formatDateShort}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`
            }
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatNumber(value), name]}
            contentStyle={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
            }}
          />
          <Legend />
          {models.map((m, i) => (
            <Line
              key={m}
              type="monotone"
              dataKey={m}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
