import { useMemo, useRef, useState, useEffect } from "react";
import type { DashboardRow, DashboardTotals, ViewMode } from "../types";
import { formatNumber, formatCurrency, formatDate, shortenProject } from "../utils";

function useGlowingModels(modelRows: DashboardRow[]): Set<string> {
  const prevTokens = useRef<Map<string, number>>(new Map());
  const [glowing, setGlowing] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const curr = new Map<string, number>();
    for (const row of modelRows) {
      const m = row.model ?? "unknown";
      curr.set(m, (curr.get(m) ?? 0) + row.totalTokens);
    }

    const active = new Set<string>();
    for (const [model, tokens] of curr) {
      const prev = prevTokens.current.get(model) ?? 0;
      if (prev > 0 && tokens > prev) active.add(model);
    }

    prevTokens.current = curr;

    if (active.size > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setGlowing(active);
      timerRef.current = setTimeout(() => setGlowing(new Set()), 1100);
    }
  }, [modelRows]);

  return glowing;
}

interface UsageTableProps {
  rows: DashboardRow[];
  totals: DashboardTotals;
  viewMode: ViewMode;
  modelRows: DashboardRow[];
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

const TODAY = new Date();
const TODAY_STR = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`;

function isCurrent(date: string): boolean {
  return TODAY_STR.startsWith(date);
}

export function UsageTable({ rows, totals, viewMode, modelRows }: UsageTableProps) {
  const glowing = useGlowingModels(modelRows);
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
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Date</th>
              <th>Projects</th>
              <th>Models</th>
              <th>Input</th>
              <th>Output</th>
              <th>Cache Create</th>
              <th>Cache Read</th>
              <th>Total</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {projectGroups.map((group) => (
              <tr key={group.date} style={{ background: monthColor(group.date) }}>
                <td className="date-cell">{formatDate(group.date)}</td>
                <td className="projects-compact-cell">
                  <div className="projects-list">
                    {group.projects
                      .filter((p) => shortenProject(p.name) !== "~")
                      .map((p) => (
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
                      <span key={m} className={`model-tag${isCurrent(group.date) && glowing.has(m) ? " glow" : ""}`}>{m}</span>
                    ))}
                  </div>
                </td>
                <td>{formatNumber(group.inputTokens)}</td>
                <td>{formatNumber(group.outputTokens)}</td>
                <td>{formatNumber(group.cacheCreationTokens)}</td>
                <td>{formatNumber(group.cacheReadTokens)}</td>
                <td>{formatNumber(group.totalTokens)}</td>
                <td className="cost">{formatCurrency(group.costUSD)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td><strong>Total</strong></td>
              <td />
              <td />
              <td><strong>{formatNumber(totals.inputTokens)}</strong></td>
              <td><strong>{formatNumber(totals.outputTokens)}</strong></td>
              <td><strong>{formatNumber(totals.cacheCreationTokens)}</strong></td>
              <td><strong>{formatNumber(totals.cacheReadTokens)}</strong></td>
              <td><strong>{formatNumber(totals.totalTokens)}</strong></td>
              <td className="cost"><strong>{formatCurrency(totals.costUSD)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="usage-table">
        <colgroup>
          <col style={{ width: "9%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Models</th>
            <th>Input</th>
            <th>Output</th>
            <th>Cache Create</th>
            <th>Cache Read</th>
            <th>Total</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.date}-${i}`} style={{ background: monthColor(row.date) }}>
              <td className="date-cell">{formatDate(row.date)}</td>
              <td className="models-cell">
                <div className="models-list">
                  {row.models.map((m) => (
                    <span key={m} className={`model-tag${isCurrent(row.date) && glowing.has(m) ? " glow" : ""}`}>{m}</span>
                  ))}
                </div>
              </td>
              <td>{formatNumber(row.inputTokens)}</td>
              <td>{formatNumber(row.outputTokens)}</td>
              <td>{formatNumber(row.cacheCreationTokens)}</td>
              <td>{formatNumber(row.cacheReadTokens)}</td>
              <td>{formatNumber(row.totalTokens)}</td>
              <td className="cost">{formatCurrency(row.costUSD)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td><strong>Total</strong></td>
            <td />
            <td><strong>{formatNumber(totals.inputTokens)}</strong></td>
            <td><strong>{formatNumber(totals.outputTokens)}</strong></td>
            <td><strong>{formatNumber(totals.cacheCreationTokens)}</strong></td>
            <td><strong>{formatNumber(totals.cacheReadTokens)}</strong></td>
            <td><strong>{formatNumber(totals.totalTokens)}</strong></td>
            <td className="cost"><strong>{formatCurrency(totals.costUSD)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
