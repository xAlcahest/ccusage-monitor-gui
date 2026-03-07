import React, { useMemo, useRef, useState, useEffect } from "react";
import type { DashboardRow, DashboardTotals, ViewMode } from "../types";
import { formatCurrency, formatDate, shortenProject } from "../utils";
import { AnimatedNumber, AnimatedCurrency } from "./AnimatedValue";

const N = (n: number) => <AnimatedNumber value={n} />;
const C = (n: number) => <AnimatedCurrency value={n} />;

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

function isCurrent(date: string): boolean {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;
  // Hourly: "YYYY-MM-DD HH:00"
  if (date.includes(" ")) {
    const h = String(now.getHours()).padStart(2, "0");
    return date === `${todayStr} ${h}:00`;
  }
  return todayStr.startsWith(date);
}

function groupModelsByDate(modelRows: DashboardRow[], dateLen: number): Map<string, DashboardRow[]> {
  const byDateModel = new Map<string, DashboardRow>();
  for (const row of modelRows) {
    const date = row.date.slice(0, dateLen);
    const model = row.model ?? "";
    const key = `${date}\0${model}`;
    const existing = byDateModel.get(key);
    if (existing) {
      existing.inputTokens += row.inputTokens;
      existing.outputTokens += row.outputTokens;
      existing.cacheCreationTokens += row.cacheCreationTokens;
      existing.cacheReadTokens += row.cacheReadTokens;
      existing.totalTokens += row.totalTokens;
      existing.costUSD += row.costUSD;
    } else {
      byDateModel.set(key, { ...row, date });
    }
  }

  const byDate = new Map<string, DashboardRow[]>();
  for (const row of byDateModel.values()) {
    let list = byDate.get(row.date);
    if (!list) {
      list = [];
      byDate.set(row.date, list);
    }
    list.push(row);
  }
  for (const list of byDate.values()) {
    list.sort((a, b) => b.costUSD - a.costUSD);
  }
  return byDate;
}

export function UsageTable({ rows, totals, viewMode, modelRows }: UsageTableProps) {
  const glowing = useGlowingModels(modelRows);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const isHourly = rows.length > 0 && rows[0].date.includes(" ");
  const dateHeader = isHourly ? "Hour" : "Date";
  const projectGroups = useMemo(
    () => (viewMode === "project" ? groupProjectsByDay(rows) : []),
    [rows, viewMode],
  );
  const dateLen = rows.length > 0 ? rows[0].date.length : 10;
  const modelByDate = useMemo(
    () => groupModelsByDate(modelRows, dateLen),
    [modelRows, dateLen],
  );

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (rows.length === 0) {
    return <div className="empty-state">{"No usage data for this range."}</div>;
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
              <th>{dateHeader}</th>
              <th>{"Projects"}</th>
              <th>{"Models"}</th>
              <th>{"Input"}</th>
              <th>{"Output"}</th>
              <th>{"Cache Create"}</th>
              <th>{"Cache Read"}</th>
              <th>{"Total"}</th>
              <th>{"Cost"}</th>
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
                <td>{N(group.inputTokens)}</td>
                <td>{N(group.outputTokens)}</td>
                <td>{N(group.cacheCreationTokens)}</td>
                <td>{N(group.cacheReadTokens)}</td>
                <td>{N(group.totalTokens)}</td>
                <td className="cost">{C(group.costUSD)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td><strong>{"Total"}</strong></td>
              <td />
              <td />
              <td><strong>{N(totals.inputTokens)}</strong></td>
              <td><strong>{N(totals.outputTokens)}</strong></td>
              <td><strong>{N(totals.cacheCreationTokens)}</strong></td>
              <td><strong>{N(totals.cacheReadTokens)}</strong></td>
              <td><strong>{N(totals.totalTokens)}</strong></td>
              <td className="cost"><strong>{C(totals.costUSD)}</strong></td>
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
            <th>{dateHeader}</th>
            <th>{"Models"}</th>
            <th>{"Input"}</th>
            <th>{"Output"}</th>
            <th>{"Cache Create"}</th>
            <th>{"Cache Read"}</th>
            <th>{"Total"}</th>
            <th>{"Cost"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const hasModels = modelByDate.has(row.date);
            const isExpanded = expandedDates.has(row.date);
            const subRows = isExpanded ? (modelByDate.get(row.date) ?? []) : [];
            return (
              <React.Fragment key={`${row.date}-${i}`}>
                <tr style={{ background: monthColor(row.date) }}>
                  <td className="date-cell">
                    {hasModels && (
                      <button className={`expand-btn ${isExpanded ? "expanded" : ""}`} onClick={() => toggleDate(row.date)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    )}
                    {formatDate(row.date)}
                  </td>
                  <td className="models-cell">
                    <div className="models-list">
                      {row.models.map((m) => (
                        <span key={m} className={`model-tag${isCurrent(row.date) && glowing.has(m) ? " glow" : ""}`}>{m}</span>
                      ))}
                    </div>
                  </td>
                  <td>{N(row.inputTokens)}</td>
                  <td>{N(row.outputTokens)}</td>
                  <td>{N(row.cacheCreationTokens)}</td>
                  <td>{N(row.cacheReadTokens)}</td>
                  <td>{N(row.totalTokens)}</td>
                  <td className="cost">{C(row.costUSD)}</td>
                </tr>
                {subRows.map((sr) => (
                  <tr key={`${row.date}-${sr.model}`} className="breakdown-row" style={{ background: monthColor(row.date) }}>
                    <td className="date-cell breakdown-indent">└─ {sr.model}</td>
                    <td />
                    <td>{N(sr.inputTokens)}</td>
                    <td>{N(sr.outputTokens)}</td>
                    <td>{N(sr.cacheCreationTokens)}</td>
                    <td>{N(sr.cacheReadTokens)}</td>
                    <td>{N(sr.totalTokens)}</td>
                    <td className="cost">{C(sr.costUSD)}</td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td><strong>{"Total"}</strong></td>
            <td />
            <td><strong>{N(totals.inputTokens)}</strong></td>
            <td><strong>{N(totals.outputTokens)}</strong></td>
            <td><strong>{N(totals.cacheCreationTokens)}</strong></td>
            <td><strong>{N(totals.cacheReadTokens)}</strong></td>
            <td><strong>{N(totals.totalTokens)}</strong></td>
            <td className="cost"><strong>{C(totals.costUSD)}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
