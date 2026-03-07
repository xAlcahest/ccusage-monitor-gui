import { useTranslation } from "react-i18next";
import type { TodayMode } from "../types";

interface TodayModeToggleProps {
  value: TodayMode;
  onChange: (mode: TodayMode) => void;
}

export function TodayModeToggle({ value, onChange }: TodayModeToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="filter-group">
      <span className="filter-label">{t("todayMode.label")}</span>
      <div className="filter-buttons">
        <button
          className={`filter-btn ${value === "day" ? "active" : ""}`}
          onClick={() => onChange("day")}
        >
          {t("todayMode.day")}
        </button>
        <button
          className={`filter-btn ${value === "hourly" ? "active" : ""}`}
          onClick={() => onChange("hourly")}
        >
          {t("todayMode.hourly")}
        </button>
      </div>
    </div>
  );
}
