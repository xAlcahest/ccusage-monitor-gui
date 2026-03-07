import { useTranslation } from "react-i18next";
import type { AggregationMode } from "../types";

interface AggregationToggleProps {
  value: AggregationMode;
  onChange: (mode: AggregationMode) => void;
}

export function AggregationToggle({ value, onChange }: AggregationToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="filter-group">
      <span className="filter-label">{t("aggregation.label")}</span>
      <div className="filter-buttons">
        <button
          className={`filter-btn ${value === "years" ? "active" : ""}`}
          onClick={() => onChange("years")}
        >
          {t("aggregation.years")}
        </button>
        <button
          className={`filter-btn ${value === "days" ? "active" : ""}`}
          onClick={() => onChange("days")}
        >
          {t("aggregation.days")}
        </button>
      </div>
    </div>
  );
}
