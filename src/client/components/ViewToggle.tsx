import type { ViewMode } from "../types";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="filter-group">
      <span className="filter-label">View:</span>
      <div className="filter-buttons">
        <button
          className={`filter-btn ${value === "daily" ? "active" : ""}`}
          onClick={() => onChange("daily")}
        >
          By Day
        </button>
        <button
          className={`filter-btn ${value === "project" ? "active" : ""}`}
          onClick={() => onChange("project")}
        >
          By Project
        </button>
      </div>
    </div>
  );
}
