export interface DashboardRow {
  date: string;
  project?: string;
  model?: string;
  models: string[];
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUSD: number;
}

export interface DashboardTotals {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUSD: number;
}

export interface ModelTotals {
  model: string;
  totalTokens: number;
  cost: number;
}

export interface DashboardData {
  rows: DashboardRow[];
  totals: DashboardTotals;
  modelTotals: ModelTotals[];
  lastUpdated: string;
}

export interface WSMessage {
  type: "snapshot" | "update";
  data: DashboardData;
  projectRows: DashboardRow[];
  modelRows: DashboardRow[];
  hourlyRows: DashboardRow[];
  hourlyProjectRows: DashboardRow[];
  hourlyModelRows: DashboardRow[];
}

export type DateRange =
  | "today"
  | "this-month"
  | "monthly"
  | "all"
  | { from: string; to: string };

export type ViewMode = "daily" | "project";

export type AggregationMode = "days" | "years";

export type TodayMode = "hourly" | "day";

export type ThemeMode = "auto" | "dark" | "light";
export type UpdateChannel = "release" | "prerelease" | "all";

export interface AppSettings {
  theme: ThemeMode;
  locale: string;
  animateNumbers: boolean;
  autoUpdate: boolean;
  updateChannel: UpdateChannel;
  projectsPath: string;
}
