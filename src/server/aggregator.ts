import type {
  UsageEntry,
  DailyUsage,
  DailyProjectUsage,
  DailyModelUsage,
  DashboardData,
  DashboardRow,
  ModelTotals,
} from "./types.js";
import { formatModelName } from "./pricing.js";

function toLocalDate(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class UsageAggregator {
  private dailyData = new Map<string, DailyUsage>();
  private dailyProjectData = new Map<string, DailyProjectUsage>();
  private dailyModelData = new Map<string, DailyModelUsage>();
  private modelTokens = new Map<string, { totalTokens: number; cost: number }>();

  addEntry(entry: UsageEntry): void {
    this.updateDaily(entry, 1);
    this.updateDailyProject(entry, 1);
    this.updateDailyModel(entry, 1);
    this.updateModelTotals(entry, 1);
  }

  removeEntry(entry: UsageEntry): void {
    this.updateDaily(entry, -1);
    this.updateDailyProject(entry, -1);
    this.updateDailyModel(entry, -1);
    this.updateModelTotals(entry, -1);
  }

  replaceEntry(oldEntry: UsageEntry, newEntry: UsageEntry): void {
    this.removeEntry(oldEntry);
    this.addEntry(newEntry);
  }

  getDashboardData(): DashboardData {
    const rows: DashboardRow[] = [];

    for (const [, daily] of this.dailyData) {
      const totalTokens =
        daily.inputTokens +
        daily.outputTokens +
        daily.cacheCreationTokens +
        daily.cacheReadTokens;
      rows.push({
        date: daily.date,
        models: [...daily.models].map(formatModelName).sort(),
        inputTokens: daily.inputTokens,
        outputTokens: daily.outputTokens,
        cacheCreationTokens: daily.cacheCreationTokens,
        cacheReadTokens: daily.cacheReadTokens,
        totalTokens,
        costUSD: daily.totalCost,
      });
    }

    rows.sort((a, b) => a.date.localeCompare(b.date));

    const totals = rows.reduce(
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

    const modelTotals: ModelTotals[] = [...this.modelTokens.entries()]
      .map(([model, data]) => ({
        model: formatModelName(model),
        totalTokens: data.totalTokens,
        cost: data.cost,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    return {
      rows,
      totals,
      modelTotals,
      lastUpdated: new Date().toISOString(),
    };
  }

  getProjectRows(): DashboardRow[] {
    const rows: DashboardRow[] = [];

    for (const [, dp] of this.dailyProjectData) {
      const totalTokens =
        dp.inputTokens +
        dp.outputTokens +
        dp.cacheCreationTokens +
        dp.cacheReadTokens;
      rows.push({
        date: dp.date,
        project: dp.project,
        models: [...dp.models].map(formatModelName).sort(),
        inputTokens: dp.inputTokens,
        outputTokens: dp.outputTokens,
        cacheCreationTokens: dp.cacheCreationTokens,
        cacheReadTokens: dp.cacheReadTokens,
        totalTokens,
        costUSD: dp.totalCost,
      });
    }

    return rows.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.project ?? "").localeCompare(b.project ?? ""),
    );
  }

  getModelRows(): DashboardRow[] {
    const rows: DashboardRow[] = [];

    for (const [, dm] of this.dailyModelData) {
      const totalTokens =
        dm.inputTokens +
        dm.outputTokens +
        dm.cacheCreationTokens +
        dm.cacheReadTokens;
      rows.push({
        date: dm.date,
        model: formatModelName(dm.model),
        models: [formatModelName(dm.model)],
        inputTokens: dm.inputTokens,
        outputTokens: dm.outputTokens,
        cacheCreationTokens: dm.cacheCreationTokens,
        cacheReadTokens: dm.cacheReadTokens,
        totalTokens,
        costUSD: dm.totalCost,
      });
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }

  private updateDailyModel(entry: UsageEntry, sign: 1 | -1): void {
    const date = toLocalDate(entry.timestamp);
    const key = `${date}:${entry.model}`;
    let dm = this.dailyModelData.get(key);
    if (!dm) {
      dm = {
        date,
        model: entry.model,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        totalCost: 0,
      };
      this.dailyModelData.set(key, dm);
    }

    dm.inputTokens += entry.inputTokens * sign;
    dm.outputTokens += entry.outputTokens * sign;
    dm.cacheCreationTokens += entry.cacheCreationTokens * sign;
    dm.cacheReadTokens += entry.cacheReadTokens * sign;
    dm.totalCost += entry.cost * sign;
  }

  private updateDaily(entry: UsageEntry, sign: 1 | -1): void {
    const date = toLocalDate(entry.timestamp);
    let daily = this.dailyData.get(date);
    if (!daily) {
      daily = {
        date,
        models: new Set(),
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        totalCost: 0,
      };
      this.dailyData.set(date, daily);
    }

    daily.models.add(entry.model);
    daily.inputTokens += entry.inputTokens * sign;
    daily.outputTokens += entry.outputTokens * sign;
    daily.cacheCreationTokens += entry.cacheCreationTokens * sign;
    daily.cacheReadTokens += entry.cacheReadTokens * sign;
    daily.totalCost += entry.cost * sign;
  }

  private updateDailyProject(entry: UsageEntry, sign: 1 | -1): void {
    const date = toLocalDate(entry.timestamp);
    const key = `${date}:${entry.project}`;
    let dp = this.dailyProjectData.get(key);
    if (!dp) {
      dp = {
        date,
        project: entry.project,
        models: new Set(),
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        totalCost: 0,
      };
      this.dailyProjectData.set(key, dp);
    }

    dp.models.add(entry.model);
    dp.inputTokens += entry.inputTokens * sign;
    dp.outputTokens += entry.outputTokens * sign;
    dp.cacheCreationTokens += entry.cacheCreationTokens * sign;
    dp.cacheReadTokens += entry.cacheReadTokens * sign;
    dp.totalCost += entry.cost * sign;
  }

  private updateModelTotals(entry: UsageEntry, sign: 1 | -1): void {
    const existing = this.modelTokens.get(entry.model) ?? {
      totalTokens: 0,
      cost: 0,
    };
    const entryTokens =
      entry.inputTokens +
      entry.outputTokens +
      entry.cacheCreationTokens +
      entry.cacheReadTokens;

    existing.totalTokens += entryTokens * sign;
    existing.cost += entry.cost * sign;
    this.modelTokens.set(entry.model, existing);
  }
}
