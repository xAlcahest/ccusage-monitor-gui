import { useState, useCallback } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useUsageData } from "./hooks/useUsageData";
import { Titlebar } from "./components/Titlebar";
import { Header } from "./components/Header";
import { DateRangeFilter } from "./components/DateRangeFilter";
import { ViewToggle } from "./components/ViewToggle";
import { UpdateModeSelector } from "./components/UpdateModeSelector";
import { UsageTable } from "./components/UsageTable";
import { ProjectLeaderboard } from "./components/ProjectLeaderboard";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { CostChart } from "./components/CostChart";
import { TokenBreakdown } from "./components/TokenBreakdown";
import { ModelDistribution } from "./components/ModelDistribution";
import { AggregationToggle } from "./components/AggregationToggle";
import { UpdateBanner } from "./components/UpdateBanner";
import type { DateRange, ViewMode, AggregationMode } from "./types";

export function App() {
  const { data, projectRows, modelRows, connected, send } = useWebSocket();
  const [dateRange, setDateRange] = useState<DateRange>("this-month");
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [updateInterval, setUpdateInterval] = useState(0);
  const [aggregationMode, setAggregationMode] = useState<AggregationMode>("years");
  const { rows, totals, filteredProjectRows, filteredModelTotals, filteredModelRows } = useUsageData(data, projectRows, modelRows, dateRange, viewMode, aggregationMode);

  const handleUpdateModeChange = useCallback(
    (intervalMs: number) => {
      setUpdateInterval(intervalMs);
      send({ type: "setUpdateMode", intervalMs });
    },
    [send],
  );

  return (
    <div className="app-shell">
      <Titlebar />
      <UpdateBanner />
      <div className="app-body">
        <ProjectSidebar rows={projectRows} />
        <div className="app-main">
          <Header
            connected={connected}
            lastUpdated={data?.lastUpdated ?? null}
          />

          <div className="controls">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            {dateRange === "all" && (
              <AggregationToggle value={aggregationMode} onChange={setAggregationMode} />
            )}
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <UpdateModeSelector value={updateInterval} onChange={handleUpdateModeChange} />
          </div>

          <ProjectLeaderboard rows={filteredProjectRows} />

          <UsageTable rows={rows} totals={totals} viewMode={viewMode} modelRows={filteredModelRows} />

          <div className="charts-grid">
            <CostChart rows={rows} />
            <TokenBreakdown rows={rows} />
            <ModelDistribution modelRows={filteredModelRows} rows={rows} />
          </div>
        </div>
      </div>
    </div>
  );
}
