import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DashboardRow } from "../types";
import { formatCurrency, shortenProject } from "../utils";

interface ProjectSidebarProps {
  rows: DashboardRow[];
}

interface ProjectStats {
  name: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUSD: number;
}

function aggregateByProject(rows: DashboardRow[]): ProjectStats[] {
  const byProject = new Map<string, ProjectStats>();

  for (const row of rows) {
    const name = row.project ?? "unknown";
    let stats = byProject.get(name);
    if (!stats) {
      stats = { name, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, costUSD: 0 };
      byProject.set(name, stats);
    }
    stats.inputTokens += row.inputTokens;
    stats.outputTokens += row.outputTokens;
    stats.cacheCreationTokens += row.cacheCreationTokens;
    stats.cacheReadTokens += row.cacheReadTokens;
    stats.totalTokens += row.totalTokens;
    stats.costUSD += row.costUSD;
  }

  return [...byProject.values()].sort((a, b) => b.costUSD - a.costUSD);
}

function compactTokens(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

const STORAGE_KEY = "sidebar-collapsed";

function getInitialCollapsed(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function ProjectSidebar({ rows }: ProjectSidebarProps) {
  const { t } = useTranslation();
  const allProjects = useMemo(() => aggregateByProject(rows), [rows]);
  const projects = useMemo(
    () => allProjects.filter((p) => shortenProject(p.name) !== "~"),
    [allProjects],
  );
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  };

  const maxCost = projects[0]?.costUSD ?? 1;

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      {!collapsed && (
        <div className="sidebar-content">
          <h3 className="sidebar-title">{t("sidebar.title")}</h3>
          <div className="sidebar-list">
            {projects.map((p, i) => (
              <div key={p.name} className="sidebar-item" title={p.name}>
                <div
                  className="sidebar-item-bar"
                  style={{ width: `${(p.costUSD / maxCost) * 100}%` }}
                />
                <div className="sidebar-item-row">
                  <span className="sidebar-item-rank">{i + 1}</span>
                  <span className="sidebar-item-name">{shortenProject(p.name)}</span>
                  <span className="sidebar-item-cost">{formatCurrency(p.costUSD)}</span>
                </div>
                <div className="sidebar-item-stats">
                  <span>{t("leaderboard.in")} {compactTokens(p.inputTokens)}</span>
                  <span>{t("leaderboard.out")} {compactTokens(p.outputTokens)}</span>
                  <span>{t("leaderboard.cc")} {compactTokens(p.cacheCreationTokens)}</span>
                  <span>{t("leaderboard.cr")} {compactTokens(p.cacheReadTokens)}</span>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="sidebar-empty">{t("sidebar.empty")}</div>
            )}
          </div>
        </div>
      )}
      <button className="sidebar-toggle" onClick={toggleCollapsed} title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}>
        <span className={`sidebar-arrow ${collapsed ? "" : "expanded"}`}>&#9654;</span>
      </button>
    </aside>
  );
}
