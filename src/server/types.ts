export interface AssistantRecord {
  type: string;
  timestamp: string;
  requestId?: string;
  cwd?: string;
  message: {
    model?: string;
    id?: string;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    stop_reason?: string | null;
  };
}

export interface UsageEntry {
  requestId: string;
  timestamp: string;
  model: string;
  project: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface DailyUsage {
  date: string;
  models: Set<string>;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
}

export interface DailyProjectUsage extends DailyUsage {
  project: string;
}

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

export interface DailyModelUsage {
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
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
}
