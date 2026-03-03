import { useEffect, useRef, useState, useCallback } from "react";
import type { AppSettings, ThemeMode, UpdateChannel } from "../types";

type Section = "appearance" | "updates" | "advanced";

interface SettingsProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onClose: () => void;
}

export function Settings({ settings, onChange, onClose }: SettingsProps) {
  const [section, setSection] = useState<Section>("appearance");
  const [closing, setClosing] = useState(false);
  const [version, setVersion] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "up-to-date" | "error">("idle");
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 150);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    window.electronAPI?.getVersion().then(setVersion);
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;
    const cleanupChecking = window.electronAPI.onUpdateChecking(() => {
      setUpdateStatus("checking");
    });
    const cleanupNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      setUpdateStatus("up-to-date");
    });
    const cleanupAvailable = window.electronAPI.onUpdateAvailable(() => {
      setUpdateStatus("idle");
    });
    const cleanupError = window.electronAPI.onUpdateError(() => {
      setUpdateStatus("error");
    });
    return () => {
      cleanupChecking();
      cleanupNotAvailable();
      cleanupAvailable();
      cleanupError();
    };
  }, []);

  const setTheme = (theme: ThemeMode) => onChange({ ...settings, theme });
  const setAutoUpdate = (autoUpdate: boolean) => onChange({ ...settings, autoUpdate });
  const setUpdateChannel = (updateChannel: UpdateChannel) => onChange({ ...settings, updateChannel });
  const setProjectsPath = (projectsPath: string) => onChange({ ...settings, projectsPath });

  return (
    <div className={`settings-overlay${closing ? " closing" : ""}`} ref={overlayRef}>
      <nav className="settings-nav">
        <NavItem icon={<PaletteIcon />} label="Appearance" active={section === "appearance"} onClick={() => setSection("appearance")} />
        <NavItem icon={<UpdateIcon />} label="Updates" active={section === "updates"} onClick={() => setSection("updates")} />
        <NavItem icon={<GearIcon />} label="Advanced" active={section === "advanced"} onClick={() => setSection("advanced")} />
      </nav>

      <div className="settings-content">
        <button className="settings-close" onClick={close} title="Close (Esc)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {section === "appearance" && (
          <div className="settings-section">
            <h2>Appearance</h2>
            <p className="settings-desc">Customize how the app looks.</p>

            <div className="settings-group">
              <label>Theme</label>
              <div className="settings-btn-group">
                {(["auto", "dark", "light"] as const).map((t) => (
                  <button key={t} className={`settings-btn${settings.theme === t ? " active" : ""}`} onClick={() => setTheme(t)}>
                    {t === "auto" ? "Auto" : t === "dark" ? "Dark" : "Light"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "updates" && (
          <div className="settings-section">
            <h2>Updates</h2>
            <p className="settings-desc">Manage application updates.</p>

            {window.electronAPI && (
              <>
                <div className="settings-group">
                  <button
                    className="settings-action-btn"
                    disabled={updateStatus === "checking"}
                    onClick={() => {
                      setUpdateStatus("checking");
                      window.electronAPI!.checkForUpdate();
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={updateStatus === "checking" ? "spin" : ""}>
                      <path d="M21.5 2v6h-6" />
                      <path d="M2.5 22v-6h6" />
                      <path d="M2.5 11.5a10 10 0 0 1 18.8-4.3" />
                      <path d="M21.5 12.5a10 10 0 0 1-18.8 4.3" />
                    </svg>
                    {updateStatus === "checking" ? "Checking..." : "Check for updates"}
                  </button>
                  {version && <p className="settings-version">Current version: v{version}</p>}
                  {updateStatus === "up-to-date" && <p className="settings-version settings-success">You're up to date!</p>}
                  {updateStatus === "error" && <p className="settings-version settings-error">Failed to check for updates.</p>}
                </div>

                <hr className="settings-separator" />

                <div className="settings-group">
                  <div className="settings-toggle">
                    <div>
                      <div className="settings-toggle-label">Automatic updates</div>
                      <div className="settings-toggle-desc">Check for updates every 30 minutes</div>
                    </div>
                    <button className={`toggle-switch${settings.autoUpdate ? " on" : ""}`} onClick={() => setAutoUpdate(!settings.autoUpdate)} />
                  </div>
                </div>

                <div className="settings-group">
                  <label>Update channel</label>
                  <div className="settings-btn-group">
                    {(["release", "prerelease", "all"] as const).map((ch) => (
                      <button key={ch} className={`settings-btn${settings.updateChannel === ch ? " active" : ""}`} onClick={() => setUpdateChannel(ch)}>
                        {ch === "release" ? "Stable" : ch === "prerelease" ? "Pre-release" : "All"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!window.electronAPI && (
              <p className="settings-version">Updates are only available in the desktop app.</p>
            )}
          </div>
        )}

        {section === "advanced" && (
          <div className="settings-section">
            <h2>Advanced</h2>
            <p className="settings-desc">Advanced configuration options.</p>

            <div className="settings-group">
              <label>Claude Projects Path</label>
              <input
                className="settings-input"
                type="text"
                value={settings.projectsPath}
                onChange={(e) => setProjectsPath(e.target.value)}
                spellCheck={false}
              />
              <p className="settings-input-hint">Directory where Claude Code stores project data. Requires restart to take effect.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`settings-nav-item${active ? " active" : ""}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function PaletteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2" />
      <circle cx="17.5" cy="10.5" r="2" />
      <circle cx="8.5" cy="7.5" r="2" />
      <circle cx="6.5" cy="12.5" r="2" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function UpdateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
