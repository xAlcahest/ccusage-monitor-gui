import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { DashboardRow } from "../types";
import { formatCurrency, formatDateShort } from "../utils";

interface CostChartProps {
  rows: DashboardRow[];
}

export function CostChart({ rows }: CostChartProps) {
  const { t } = useTranslation();

  if (rows.length === 0) return null;

  const isHourly = rows[0].date.includes(" ");
  const dateLen = rows[0].date.length;
  const periodLabel = isHourly ? t("period.hourly") : dateLen === 4 ? t("period.yearly") : dateLen === 7 ? t("period.monthly") : t("period.daily");

  const byDate = new Map<string, number>();
  for (const r of rows) {
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.costUSD);
  }
  const data = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cost]) => ({ date, cost: parseFloat(cost.toFixed(2)) }));

  return (
    <div className="chart-card">
      <h3>{t("chart.cost", { period: periodLabel })}</h3>
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
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), t("chart.costLabel")]}
            contentStyle={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
            }}
          />
          <Line type="monotone" dataKey="cost" stroke="var(--cost-color)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
