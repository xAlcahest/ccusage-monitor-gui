import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DashboardRow } from "../types";
import { formatCurrency, shortenProject } from "../utils";

interface ProjectLeaderboardProps {
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

const STORAGE_KEY = "leaderboard-collapsed";

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function ProjectLeaderboard({ rows }: ProjectLeaderboardProps) {
  const { t } = useTranslation();
  const allProjects = useMemo(() => aggregateByProject(rows), [rows]);
  const projects = useMemo(
    () => allProjects.filter((p) => shortenProject(p.name) !== "~").slice(0, 5),
    [allProjects],
  );
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  if (projects.length === 0) return null;

  const maxCost = projects[0]?.costUSD ?? 1;

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  };

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-header" onClick={toggleCollapsed}>
        <span className={`collapse-arrow ${collapsed ? "collapsed" : ""}`}>&#9660;</span>
        {t("leaderboard.title")}
      </h3>
      {!collapsed && (
        <div className="lb-cards">
          {projects.map((p, i) => (
            <div key={p.name} className="lb-card" title={p.name}>
              <div
                className="lb-card-bar"
                style={{ width: `${(p.costUSD / maxCost) * 100}%` }}
              />
              <div className="lb-card-top">
                <span className="lb-card-rank">{i + 1}</span>
                <span className="lb-card-name">{shortenProject(p.name)}</span>
                <span className="lb-card-cost">{formatCurrency(p.costUSD)}</span>
              </div>
              <div className="lb-card-stats">
                <span className="lb-stat" title={t("leaderboard.inputTokens")}>{t("leaderboard.in")} {compactTokens(p.inputTokens)}</span>
                <span className="lb-stat" title={t("leaderboard.outputTokens")}>{t("leaderboard.out")} {compactTokens(p.outputTokens)}</span>
                <span className="lb-stat" title={t("leaderboard.cacheCreate")}>{t("leaderboard.cc")} {compactTokens(p.cacheCreationTokens)}</span>
                <span className="lb-stat" title={t("leaderboard.cacheRead")}>{t("leaderboard.cr")} {compactTokens(p.cacheReadTokens)}</span>
                <span className="lb-stat" title={t("leaderboard.totalTokens")}>{t("leaderboard.tot")} {compactTokens(p.totalTokens)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
