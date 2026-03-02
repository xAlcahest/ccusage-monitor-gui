import { useState, useEffect } from "react";

type BannerState = "downloading" | "ready" | "installing" | "error";

export function UpdateBanner() {
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
        <span>Downloading update v{updateVersion}...</span>
      )}
      {state === "ready" && (
        <>
          <span>v{updateVersion} ready to install.</span>
          <button
            className="update-btn"
            onClick={() => window.electronAPI?.installUpdate()}
          >
            Restart & Update
          </button>
        </>
      )}
      {state === "installing" && (
        <span>Installing v{updateVersion} via dnf... (check polkit prompt)</span>
      )}
      {state === "error" && (
        <>
          <span>Update failed{errorMsg ? `: ${errorMsg}` : ""}</span>
          <button
            className="update-btn"
            onClick={() => {
              setState("ready");
              setErrorMsg(null);
            }}
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
