import { useTranslation } from "react-i18next";
import type { ViewMode } from "../types";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="filter-group">
      <span className="filter-label">{t("view.label")}</span>
      <div className="filter-buttons">
        <button
          className={`filter-btn ${value === "daily" ? "active" : ""}`}
          onClick={() => onChange("daily")}
        >
          {t("view.byDay")}
        </button>
        <button
          className={`filter-btn ${value === "project" ? "active" : ""}`}
          onClick={() => onChange("project")}
        >
          {t("view.byProject")}
        </button>
      </div>
    </div>
  );
}
