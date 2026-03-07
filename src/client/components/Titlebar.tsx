import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function Titlebar() {
  const { t } = useTranslation();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.isMaximized().then(setMaximized);
    return window.electronAPI.onMaximizeChange(setMaximized);
  }, []);

  if (!window.electronAPI) return null;

  return (
    <div className="titlebar">
      <div className="titlebar-title">{t("header.title")}</div>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn"
          onClick={() => window.electronAPI!.minimize()}
          title={t("titlebar.minimize")}
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          className="titlebar-btn"
          onClick={() => window.electronAPI!.maximize()}
          title={maximized ? t("titlebar.restore") : t("titlebar.maximize")}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M3 0h7v7h-2v3H0V3h3V0zm1 1v2h4v4h2V1H4zM1 4v5h6V4H1z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                x=".5"
                y=".5"
                width="9"
                height="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          )}
        </button>
        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={() => window.electronAPI!.close()}
          title={t("titlebar.close")}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
