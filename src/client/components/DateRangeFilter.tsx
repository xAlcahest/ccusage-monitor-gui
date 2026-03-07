import { useTranslation } from "react-i18next";
import type { DateRange } from "../types";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type PresetKey = "all" | "monthly" | "this-month" | "today";
const PRESETS: { key: PresetKey; labelKey: string }[] = [
  { key: "all", labelKey: "range.all" },
  { key: "monthly", labelKey: "range.monthly" },
  { key: "this-month", labelKey: "range.thisMonth" },
  { key: "today", labelKey: "range.today" },
];

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const { t } = useTranslation();
  const activeKey = typeof value === "string" ? value : "custom";

  return (
    <div className="filter-group">
      <span className="filter-label">{t("range.label")}</span>
      <div className="filter-buttons">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            className={`filter-btn ${activeKey === p.key ? "active" : ""}`}
            onClick={() => onChange(p.key)}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
