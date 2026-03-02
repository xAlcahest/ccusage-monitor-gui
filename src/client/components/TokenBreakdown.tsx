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
import type { DashboardRow } from "../types";
import { formatNumber, formatDateShort } from "../utils";

interface TokenBreakdownProps {
  rows: DashboardRow[];
}

export function TokenBreakdown({ rows }: TokenBreakdownProps) {
  if (rows.length === 0) return null;

  const dateLen = rows[0].date.length;
  const periodLabel = dateLen === 4 ? "Yearly" : dateLen === 7 ? "Monthly" : "Daily";

  const byDate = new Map<string, { Input: number; Output: number; "Cache Create": number; "Cache Read": number }>();
  for (const r of rows) {
    const e = byDate.get(r.date) ?? { Input: 0, Output: 0, "Cache Create": 0, "Cache Read": 0 };
    e.Input += r.inputTokens;
    e.Output += r.outputTokens;
    e["Cache Create"] += r.cacheCreationTokens;
    e["Cache Read"] += r.cacheReadTokens;
    byDate.set(r.date, e);
  }
  const data = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return (
    <div className="chart-card">
      <h3>{periodLabel} Token Breakdown</h3>
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
          <Line type="monotone" dataKey="Input" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="Output" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="Cache Create" stroke="#a78bfa" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="Cache Read" stroke="#c4b5fd" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
