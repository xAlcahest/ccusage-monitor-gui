import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

type BannerState = "downloading" | "ready" | "installing" | "error";

export function UpdateBanner() {
  const { t } = useTranslation();
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [state, setState] = useState<BannerState>("downloading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanupAvailable = window.electronAPI.onUpdateAvailable((version) => {
      setUpdateVersion(version);
      setState("downloading");
    });

    const cleanupDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setState("ready");
    });

    const cleanupInstalling = window.electronAPI.onUpdateInstalling(() => {
      setState("installing");
    });

    const cleanupError = window.electronAPI.onUpdateError((message) => {
      setState("error");
      setErrorMsg(message);
    });

    return () => {
      cleanupAvailable();
      cleanupDownloaded();
      cleanupInstalling();
      cleanupError();
    };
  }, []);

  if (!updateVersion) return null;

  return (
    <div className={`update-banner${state === "error" ? " update-banner-error" : ""}`}>
      {state === "downloading" && (
        <span>{t("update.downloading", { version: updateVersion })}</span>
      )}
      {state === "ready" && (
        <>
          <span>{t("update.ready", { version: updateVersion })}</span>
          <button
            className="update-btn"
            onClick={() => window.electronAPI?.installUpdate()}
          >
            {t("update.restartAndUpdate")}
          </button>
        </>
      )}
      {state === "installing" && (
        <span>{t("update.installing", { version: updateVersion })}</span>
      )}
      {state === "error" && (
        <>
          <span>{errorMsg ? t("update.failedWithError", { error: errorMsg }) : t("update.failed")}</span>
          <button
            className="update-btn"
            onClick={() => {
              setState("ready");
              setErrorMsg(null);
            }}
          >
            {t("update.retry")}
          </button>
        </>
      )}
    </div>
  );
}
