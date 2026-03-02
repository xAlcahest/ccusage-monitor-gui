import { useState, useEffect } from "react";

export function UpdateBanner() {
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanupAvailable = window.electronAPI.onUpdateAvailable((version) => {
      setUpdateVersion(version);
    });

    const cleanupDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setDownloaded(true);
    });

    return () => {
      cleanupAvailable();
      cleanupDownloaded();
    };
  }, []);

  if (!updateVersion) return null;

  return (
    <div className="update-banner">
      {downloaded ? (
        <>
          <span>v{updateVersion} ready to install.</span>
          <button
            className="update-btn"
            onClick={() => window.electronAPI?.installUpdate()}
          >
            Restart & Update
          </button>
        </>
      ) : (
        <span>Downloading update v{updateVersion}...</span>
      )}
    </div>
  );
}
