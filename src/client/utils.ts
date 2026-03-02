import type { DashboardRow, DateRange } from "./types";

const numberFmt = new Intl.NumberFormat("en-US");
const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

export function formatCurrency(n: number): string {
  return currencyFmt.format(n);
}

export function formatDate(dateStr: string): string {
  if (dateStr.length === 4) return dateStr; // YYYY
  if (dateStr.length === 7) {
    const [year, month] = dateStr.split("-");
    return `${month}/${year}`;
  }
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateShort(dateStr: string): string {
  if (dateStr.length <= 7) return formatDate(dateStr); // YYYY or MM/YYYY
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDateRangeBounds(range: DateRange): {
  from: string;
  to: string;
} {
  if (typeof range === "object") return range;

  const now = new Date();
  const to = localDateStr(now);

  switch (range) {
    case "today":
      return { from: to, to };
    case "this-month": {
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      return { from, to };
    }
    case "monthly":
    case "all":
      return { from: "2000-01-01", to: "2099-12-31" };
  }
}

export function filterRows(
  rows: DashboardRow[],
  range: DateRange,
): DashboardRow[] {
  const { from, to } = getDateRangeBounds(range);
  return rows.filter((r) => r.date >= from && r.date <= to);
}

export function computeTotals(rows: DashboardRow[]) {
  return rows.reduce(
    (acc, row) => ({
      inputTokens: acc.inputTokens + row.inputTokens,
      outputTokens: acc.outputTokens + row.outputTokens,
      cacheCreationTokens: acc.cacheCreationTokens + row.cacheCreationTokens,
      cacheReadTokens: acc.cacheReadTokens + row.cacheReadTokens,
      totalTokens: acc.totalTokens + row.totalTokens,
      costUSD: acc.costUSD + row.costUSD,
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0,
      costUSD: 0,
    },
  );
}

export function aggregateByMonth(rows: DashboardRow[]): DashboardRow[] {
  const byKey = new Map<
    string,
    { date: string; project?: string; inputTokens: number; outputTokens: number; cacheCreationTokens: number; cacheReadTokens: number; totalTokens: number; costUSD: number; models: Set<string> }
  >();

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    const key = row.project ? `${month}\0${row.project}` : month;
    let b = byKey.get(key);
    if (!b) {
      b = { date: month, project: row.project, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, costUSD: 0, models: new Set() };
      byKey.set(key, b);
    }
    b.inputTokens += row.inputTokens;
    b.outputTokens += row.outputTokens;
    b.cacheCreationTokens += row.cacheCreationTokens;
    b.cacheReadTokens += row.cacheReadTokens;
    b.totalTokens += row.totalTokens;
    b.costUSD += row.costUSD;
    for (const m of row.models) b.models.add(m);
  }

  return [...byKey.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((b) => ({
      date: b.date,
      ...(b.project !== undefined && { project: b.project }),
      models: [...b.models].sort(),
      inputTokens: b.inputTokens,
      outputTokens: b.outputTokens,
      cacheCreationTokens: b.cacheCreationTokens,
      cacheReadTokens: b.cacheReadTokens,
      totalTokens: b.totalTokens,
      costUSD: b.costUSD,
    }));
}

export function aggregateByYear(rows: DashboardRow[]): DashboardRow[] {
  const byKey = new Map<
    string,
    { date: string; project?: string; inputTokens: number; outputTokens: number; cacheCreationTokens: number; cacheReadTokens: number; totalTokens: number; costUSD: number; models: Set<string> }
  >();

  for (const row of rows) {
    const year = row.date.slice(0, 4);
    const key = row.project ? `${year}\0${row.project}` : year;
    let b = byKey.get(key);
    if (!b) {
      b = { date: year, project: row.project, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, costUSD: 0, models: new Set() };
      byKey.set(key, b);
    }
    b.inputTokens += row.inputTokens;
    b.outputTokens += row.outputTokens;
    b.cacheCreationTokens += row.cacheCreationTokens;
    b.cacheReadTokens += row.cacheReadTokens;
    b.totalTokens += row.totalTokens;
    b.costUSD += row.costUSD;
    for (const m of row.models) b.models.add(m);
  }

  return [...byKey.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((b) => ({
      date: b.date,
      ...(b.project !== undefined && { project: b.project }),
      models: [...b.models].sort(),
      inputTokens: b.inputTokens,
      outputTokens: b.outputTokens,
      cacheCreationTokens: b.cacheCreationTokens,
      cacheReadTokens: b.cacheReadTokens,
      totalTokens: b.totalTokens,
      costUSD: b.costUSD,
    }));
}

export function shortenProject(projectPath: string): string {
  const homeMatch = projectPath.match(/^\/home\/[^/]+/);
  if (homeMatch) {
    return "~" + projectPath.slice(homeMatch[0].length);
  }
  return projectPath;
}
