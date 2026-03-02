import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DashboardRow } from "../types";
import { formatNumber } from "../utils";

interface TokenBreakdownProps {
  rows: DashboardRow[];
}

export function TokenBreakdown({ rows }: TokenBreakdownProps) {
  if (rows.length === 0) return null;

  const isMonthly = rows[0].date.length === 7;

  const data = rows.map((r) => ({
    date: r.date,
    Input: r.inputTokens,
    Output: r.outputTokens,
    "Cache Create": r.cacheCreationTokens,
    "Cache Read": r.cacheReadTokens,
  }));

  return (
    <div className="chart-card">
      <h3>{isMonthly ? "Monthly Token Breakdown" : "Token Breakdown"}</h3>
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
          <Bar dataKey="Input" fill="#6366f1" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Output" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Cache Create" fill="#a78bfa" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Cache Read" fill="#c4b5fd" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
