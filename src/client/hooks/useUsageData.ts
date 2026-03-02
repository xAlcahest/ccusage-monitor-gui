import { useMemo } from "react";
import type {
  DashboardData,
  DashboardRow,
  DashboardTotals,
  ModelTotals,
  DateRange,
  ViewMode,
  AggregationMode,
} from "../types";
import { filterRows, computeTotals, aggregateByMonth } from "../utils";

interface UseUsageDataResult {
  rows: DashboardRow[];
  totals: DashboardTotals;
  filteredProjectRows: DashboardRow[];
  filteredModelTotals: ModelTotals[];
}

export function useUsageData(
  data: DashboardData | null,
  projectRows: DashboardRow[],
  modelRows: DashboardRow[],
  dateRange: DateRange,
  viewMode: ViewMode,
  aggregationMode: AggregationMode,
): UseUsageDataResult {
  return useMemo(() => {
    const empty = {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0,
      costUSD: 0,
    };

    if (!data) {
      return { rows: [], totals: empty, filteredProjectRows: [], filteredModelTotals: [] };
    }

    const sourceRows = viewMode === "daily" ? data.rows : projectRows;
    const filtered = filterRows(sourceRows, dateRange);
    const displayRows =
      dateRange === "all" && aggregationMode === "months"
        ? aggregateByMonth(filtered)
        : filtered;
    const totals = computeTotals(filtered);
    const filteredProjectRows = filterRows(projectRows, dateRange);

    const filteredModelRows = filterRows(modelRows, dateRange);
    const modelMap = new Map<string, { totalTokens: number; cost: number }>();
    for (const row of filteredModelRows) {
      const model = row.model ?? "unknown";
      const existing = modelMap.get(model) ?? { totalTokens: 0, cost: 0 };
      existing.totalTokens += row.totalTokens;
      existing.cost += row.costUSD;
      modelMap.set(model, existing);
    }
    const filteredModelTotals: ModelTotals[] = [...modelMap.entries()]
      .map(([model, data]) => ({ model, totalTokens: data.totalTokens, cost: data.cost }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    return { rows: displayRows, totals, filteredProjectRows, filteredModelTotals };
  }, [data, projectRows, modelRows, dateRange, viewMode, aggregationMode]);
}
