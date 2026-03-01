import { useMemo } from "react";
import type { DashboardRow, DashboardTotals, ViewMode } from "../types";
import { formatNumber, formatCurrency, shortenProject } from "../utils";

interface UsageTableProps {
  rows: DashboardRow[];
  totals: DashboardTotals;
  viewMode: ViewMode;
}

interface DayProjectGroup {
  date: string;
  models: string[];
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUSD: number;
  projects: Array<{ name: string; cost: number }>;
}

function groupProjectsByDay(rows: DashboardRow[]): DayProjectGroup[] {
  const byDate = new Map<
    string,
    {
      models: Set<string>;
      inputTokens: number;
      outputTokens: number;
      cacheCreationTokens: number;
      cacheReadTokens: number;
      totalTokens: number;
      costUSD: number;
      projects: Map<string, number>;
    }
  >();

  for (const row of rows) {
    const project = row.project ?? "unknown";
    let day = byDate.get(row.date);
    if (!day) {
      day = {
        models: new Set(),
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        totalTokens: 0,
        costUSD: 0,
        projects: new Map(),
      };
      byDate.set(row.date, day);
    }
    for (const m of row.models) day.models.add(m);
    day.inputTokens += row.inputTokens;
    day.outputTokens += row.outputTokens;
    day.cacheCreationTokens += row.cacheCreationTokens;
    day.cacheReadTokens += row.cacheReadTokens;
    day.totalTokens += row.totalTokens;
    day.costUSD += row.costUSD;
    day.projects.set(project, (day.projects.get(project) ?? 0) + row.costUSD);
  }

  const groups: DayProjectGroup[] = [];
  for (const [date, day] of byDate) {
    groups.push({
      date,
      models: [...day.models].sort(),
      inputTokens: day.inputTokens,
      outputTokens: day.outputTokens,
      cacheCreationTokens: day.cacheCreationTokens,
      cacheReadTokens: day.cacheReadTokens,
      totalTokens: day.totalTokens,
      costUSD: day.costUSD,
      projects: [...day.projects.entries()]
        .map(([name, cost]) => ({ name, cost }))
        .sort((a, b) => b.cost - a.cost),
    });
  }

  return groups.sort((a, b) => a.date.localeCompare(b.date));
}

const MONTH_COLORS = [
  "rgba(99, 102, 241, 0.05)",
  "rgba(139, 92, 246, 0.05)",
];

function monthColor(date: string): string {
  const monthNum = parseInt(date.slice(5, 7), 10);
  return MONTH_COLORS[monthNum % MONTH_COLORS.length];
}

export function UsageTable({ rows, totals, viewMode }: UsageTableProps) {
  const projectGroups = useMemo(
    () => (viewMode === "project" ? groupProjectsByDay(rows) : []),
    [rows, viewMode],
  );

  if (rows.length === 0) {
    return <div className="empty-state">No usage data for this range.</div>;
  }

  if (viewMode === "project") {
    return (
      <div className="table-container">
        <table className="usage-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Projects</th>
              <th>Models</th>
              <th className="num">Input</th>
              <th className="num">Output</th>
              <th className="num">Cache Create</th>
              <th className="num">Cache Read</th>
              <th className="num">Total Tokens</th>
              <th className="num">Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {projectGroups.map((group) => (
              <tr key={group.date} style={{ background: monthColor(group.date) }}>
                <td className="date-cell">{group.date}</td>
                <td className="projects-compact-cell">
                  <div className="projects-list">
                    {group.projects.map((p) => (
                      <span
                        key={p.name}
                        className="project-entry"
                        title={p.name}
                      >
                        <span className="project-name">{shortenProject(p.name)}</span>
                        <span className="project-cost">{formatCurrency(p.cost)}</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="models-cell">
                  <div className="models-list">
                    {group.models.map((m) => (
                      <span key={m} className="model-tag">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="num">{formatNumber(group.inputTokens)}</td>
                <td className="num">{formatNumber(group.outputTokens)}</td>
                <td className="num">{formatNumber(group.cacheCreationTokens)}</td>
                <td className="num">{formatNumber(group.cacheReadTokens)}</td>
                <td className="num">{formatNumber(group.totalTokens)}</td>
                <td className="num cost">{formatCurrency(group.costUSD)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td><strong>Total</strong></td>
              <td />
              <td />
              <td className="num"><strong>{formatNumber(totals.inputTokens)}</strong></td>
              <td className="num"><strong>{formatNumber(totals.outputTokens)}</strong></td>
              <td className="num"><strong>{formatNumber(totals.cacheCreationTokens)}</strong></td>
              <td className="num"><strong>{formatNumber(totals.cacheReadTokens)}</strong></td>
              <td className="num"><strong>{formatNumber(totals.totalTokens)}</strong></td>
              <td className="num cost"><strong>{formatCurrency(totals.costUSD)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="usage-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Models</th>
            <th className="num">Input</th>
            <th className="num">Output</th>
            <th className="num">Cache Create</th>
            <th className="num">Cache Read</th>
            <th className="num">Total Tokens</th>
            <th className="num">Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.date}-${i}`} style={{ background: monthColor(row.date) }}>
              <td className="date-cell">{row.date}</td>
              <td className="models-cell">
                <div className="models-list">
                  {row.models.map((m) => (
                    <span key={m} className="model-tag">{m}</span>
                  ))}
                </div>
              </td>
              <td className="num">{formatNumber(row.inputTokens)}</td>
              <td className="num">{formatNumber(row.outputTokens)}</td>
              <td className="num">{formatNumber(row.cacheCreationTokens)}</td>
              <td className="num">{formatNumber(row.cacheReadTokens)}</td>
              <td className="num">{formatNumber(row.totalTokens)}</td>
              <td className="num cost">{formatCurrency(row.costUSD)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td><strong>Total</strong></td>
            <td />
            <td className="num"><strong>{formatNumber(totals.inputTokens)}</strong></td>
            <td className="num"><strong>{formatNumber(totals.outputTokens)}</strong></td>
            <td className="num"><strong>{formatNumber(totals.cacheCreationTokens)}</strong></td>
            <td className="num"><strong>{formatNumber(totals.cacheReadTokens)}</strong></td>
            <td className="num"><strong>{formatNumber(totals.totalTokens)}</strong></td>
            <td className="num cost"><strong>{formatCurrency(totals.costUSD)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
