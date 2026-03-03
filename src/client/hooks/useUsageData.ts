import { useMemo } from "react";
import type {
  DashboardData,
  DashboardRow,
  DashboardTotals,
  ModelTotals,
  DateRange,
  ViewMode,
  AggregationMode,
  TodayMode,
} from "../types";
import { filterRows, computeTotals, aggregateByMonth, aggregateByYear } from "../utils";

interface UseUsageDataResult {
  rows: DashboardRow[];
  chartRows: DashboardRow[];
  totals: DashboardTotals;
  filteredProjectRows: DashboardRow[];
  filteredModelTotals: ModelTotals[];
  filteredModelRows: DashboardRow[];
}

export function useUsageData(
  data: DashboardData | null,
  projectRows: DashboardRow[],
  modelRows: DashboardRow[],
  hourlyRows: DashboardRow[],
  hourlyProjectRows: DashboardRow[],
  hourlyModelRows: DashboardRow[],
  dateRange: DateRange,
  viewMode: ViewMode,
  aggregationMode: AggregationMode,
  todayMode: TodayMode,
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
      return { rows: [], chartRows: [], totals: empty, filteredProjectRows: [], filteredModelTotals: [], filteredModelRows: [] };
    }

    // Today always uses hourly data
    if (dateRange === "today") {
      const todayStr = getTodayStr();
      const sourceHourly = viewMode === "daily" ? hourlyRows : hourlyProjectRows;
      const todayHourly = sourceHourly.filter((r) => r.date.startsWith(todayStr));
      const todayHourlyModel = hourlyModelRows.filter((r) => r.date.startsWith(todayStr));
      const totals = computeTotals(todayHourly);
      const filteredProjectRows = hourlyProjectRows.filter((r) => r.date.startsWith(todayStr));

      const modelMap = new Map<string, { totalTokens: number; cost: number }>();
      for (const row of todayHourlyModel) {
        const model = row.model ?? "unknown";
        const existing = modelMap.get(model) ?? { totalTokens: 0, cost: 0 };
        existing.totalTokens += row.totalTokens;
        existing.cost += row.costUSD;
        modelMap.set(model, existing);
      }
      const filteredModelTotals: ModelTotals[] = [...modelMap.entries()]
        .map(([model, d]) => ({ model, totalTokens: d.totalTokens, cost: d.cost }))
        .sort((a, b) => b.totalTokens - a.totalTokens);

      const hourlyDisplayRows = viewMode === "daily"
        ? fillHourlyGaps(todayHourly, todayStr)
        : todayHourly;

      let tableRows: DashboardRow[];
      if (todayMode === "day") {
        const allModels = new Set<string>();
        for (const row of todayHourly) {
          for (const m of row.models) allModels.add(m);
        }
        tableRows = [{
          date: todayStr,
          models: [...allModels],
          inputTokens: totals.inputTokens,
          outputTokens: totals.outputTokens,
          cacheCreationTokens: totals.cacheCreationTokens,
          cacheReadTokens: totals.cacheReadTokens,
          totalTokens: totals.totalTokens,
          costUSD: totals.costUSD,
        }];
      } else {
        tableRows = hourlyDisplayRows;
      }

      return {
        rows: tableRows,
        chartRows: hourlyDisplayRows,
        totals,
        filteredProjectRows,
        filteredModelTotals,
        filteredModelRows: todayHourlyModel,
      };
    }

    const sourceRows = viewMode === "daily" ? data.rows : projectRows;
    const filtered = filterRows(sourceRows, dateRange);
    let displayRows = filtered;
    if (dateRange === "monthly") {
      displayRows = aggregateByMonth(filtered);
    } else if (dateRange === "all") {
      if (aggregationMode === "years") displayRows = aggregateByYear(filtered);
    }
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
      .map(([model, d]) => ({ model, totalTokens: d.totalTokens, cost: d.cost }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    return { rows: displayRows, chartRows: displayRows, totals, filteredProjectRows, filteredModelTotals, filteredModelRows };
  }, [data, projectRows, modelRows, hourlyRows, hourlyProjectRows, hourlyModelRows, dateRange, viewMode, aggregationMode, todayMode]);
}

function fillHourlyGaps(rows: DashboardRow[], todayStr: string): DashboardRow[] {
  const currentHour = new Date().getHours();
  const byHour = new Map<string, DashboardRow>();
  for (const row of rows) byHour.set(row.date, row);

  const filled: DashboardRow[] = [];
  for (let h = 0; h <= currentHour; h++) {
    const key = `${todayStr} ${String(h).padStart(2, "0")}:00`;
    filled.push(byHour.get(key) ?? {
      date: key,
      models: ["no-model-used"],
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0,
      costUSD: 0,
    });
  }
  return filled;
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
