import type { TodayMode } from "../types";

interface TodayModeToggleProps {
  value: TodayMode;
  onChange: (mode: TodayMode) => void;
}

export function TodayModeToggle({ value, onChange }: TodayModeToggleProps) {
  return (
    <div className="filter-group">
      <span className="filter-label">Detail:</span>
      <div className="filter-buttons">
        <button
          className={`filter-btn ${value === "day" ? "active" : ""}`}
          onClick={() => onChange("day")}
        >
          Day
        </button>
        <button
          className={`filter-btn ${value === "hourly" ? "active" : ""}`}
          onClick={() => onChange("hourly")}
        >
          Hourly
        </button>
      </div>
    </div>
  );
}
