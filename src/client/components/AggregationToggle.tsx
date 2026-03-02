import type { AggregationMode } from "../types";

interface AggregationToggleProps {
  value: AggregationMode;
  onChange: (mode: AggregationMode) => void;
}

export function AggregationToggle({ value, onChange }: AggregationToggleProps) {
  return (
    <div className="filter-group">
      <span className="filter-label">Show by:</span>
      <div className="filter-buttons">
        <button
          className={`filter-btn ${value === "years" ? "active" : ""}`}
          onClick={() => onChange("years")}
        >
          Years
        </button>
        <button
          className={`filter-btn ${value === "days" ? "active" : ""}`}
          onClick={() => onChange("days")}
        >
          Days
        </button>
      </div>
    </div>
  );
}
