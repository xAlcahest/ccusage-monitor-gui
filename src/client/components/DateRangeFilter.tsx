import type { DateRange } from "../types";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type PresetKey = "today" | "7d" | "this-month" | "30d" | "all";
const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "this-month", label: "This month" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All time" },
];

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const activeKey = typeof value === "string" ? value : "custom";

  return (
    <div className="filter-group">
      <span className="filter-label">Range:</span>
      <div className="filter-buttons">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            className={`filter-btn ${activeKey === p.key ? "active" : ""}`}
            onClick={() => onChange(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
