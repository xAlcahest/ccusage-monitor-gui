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
  const [year, month, day] = dateStr.split("-");
  return `${year}-${month}-${day}`;
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
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: localDateStr(d), to };
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { from: localDateStr(d), to };
    }
    case "this-month": {
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      return { from, to };
    }
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

export function shortenProject(projectPath: string): string {
  const homeMatch = projectPath.match(/^\/home\/[^/]+/);
  if (homeMatch) {
    return "~" + projectPath.slice(homeMatch[0].length);
  }
  return projectPath;
}
