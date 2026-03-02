import type { DateRange } from "../types";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type PresetKey = "all" | "monthly" | "this-month" | "today";
const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "monthly", label: "Monthly" },
  { key: "this-month", label: "This month" },
  { key: "today", label: "Today" },
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
