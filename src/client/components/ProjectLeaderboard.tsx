import { useMemo } from "react";
import type { DashboardRow } from "../types";
import { formatCurrency, shortenProject } from "../utils";

interface ProjectLeaderboardProps {
  rows: DashboardRow[];
}

interface ProjectStats {
  name: string;
  totalTokens: number;
  costUSD: number;
}

function aggregateByProject(rows: DashboardRow[]): ProjectStats[] {
  const byProject = new Map<string, ProjectStats>();

  for (const row of rows) {
    const name = row.project ?? "unknown";
    let stats = byProject.get(name);
    if (!stats) {
      stats = { name, totalTokens: 0, costUSD: 0 };
      byProject.set(name, stats);
    }
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

export function ProjectLeaderboard({ rows }: ProjectLeaderboardProps) {
  const projects = useMemo(() => aggregateByProject(rows), [rows]);

  if (projects.length === 0) return null;

  const maxCost = projects[0]?.costUSD ?? 1;

  return (
    <div className="leaderboard">
      <h3>Project Leaderboard</h3>
      <div className="lb-cards">
        {projects.map((p, i) => (
          <div key={p.name} className="lb-card" title={p.name}>
            <div
              className="lb-card-bar"
              style={{ width: `${(p.costUSD / maxCost) * 100}%` }}
            />
            <span className="lb-card-rank">{i + 1}</span>
            <span className="lb-card-name">{shortenProject(p.name)}</span>
            <span className="lb-card-tokens">{compactTokens(p.totalTokens)}</span>
            <span className="lb-card-cost">{formatCurrency(p.costUSD)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
