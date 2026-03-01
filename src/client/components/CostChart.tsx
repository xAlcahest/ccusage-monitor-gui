import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DashboardRow } from "../types";
import { formatCurrency } from "../utils";

interface CostChartProps {
  rows: DashboardRow[];
}

export function CostChart({ rows }: CostChartProps) {
  if (rows.length === 0) return null;

  const data = rows.map((r) => ({
    date: r.date,
    cost: parseFloat(r.costUSD.toFixed(2)),
  }));

  return (
    <div className="chart-card">
      <h3>Daily Cost</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Cost"]}
            contentStyle={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
            }}
          />
          <Bar dataKey="cost" fill="var(--accent)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
