import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n";
import type { AppSettings, ThemeMode, UpdateChannel } from "../types";

type Section = "appearance" | "updates" | "advanced" | "about";

interface SettingsProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onClose: () => void;
}

export function Settings({ settings, onChange, onClose }: SettingsProps) {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>("appearance");
  const [closing, setClosing] = useState(false);
  const [version, setVersion] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "up-to-date" | "error">("idle");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
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
    if (!langOpen) return;
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [langOpen]);

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
        <NavItem icon={<PaletteIcon />} label={t("settings.appearance")} active={section === "appearance"} onClick={() => setSection("appearance")} />
        <NavItem icon={<UpdateIcon />} label={t("settings.updates")} active={section === "updates"} onClick={() => setSection("updates")} />
        <NavItem icon={<GearIcon />} label={t("settings.advanced")} active={section === "advanced"} onClick={() => setSection("advanced")} />
        <NavItem icon={<InfoIcon />} label={t("settings.about")} active={section === "about"} onClick={() => setSection("about")} />
      </nav>

      <div className="settings-content">
        <button className="settings-close" onClick={close} title={t("settings.close")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {section === "appearance" && (
          <div className="settings-section">
            <h2>{t("settings.appearanceTitle")}</h2>
            <p className="settings-desc">{t("settings.appearanceDesc")}</p>

            <div className="settings-group">
              <label>{t("settings.theme")}</label>
              <div className="settings-btn-group">
                {(["auto", "dark", "light"] as const).map((th) => (
                  <button key={th} className={`settings-btn${settings.theme === th ? " active" : ""}`} onClick={() => setTheme(th)}>
                    {th === "auto" ? t("settings.themeAuto") : th === "dark" ? t("settings.themeDark") : t("settings.themeLight")}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-toggle">
                <div>
                  <div className="settings-toggle-label">{t("settings.animateNumbers")}</div>
                  <div className="settings-toggle-desc">{t("settings.animateNumbersDesc")}</div>
                </div>
                <button className={`toggle-switch${settings.animateNumbers ? " on" : ""}`} onClick={() => onChange({ ...settings, animateNumbers: !settings.animateNumbers })} />
              </div>
            </div>

            <div className="settings-group">
              <label>{t("settings.language")}</label>
              <div className="custom-select" ref={langRef}>
                <button className="custom-select-trigger" onClick={() => setLangOpen(!langOpen)}>
                  <span>{LANGUAGES.find((l) => l.code === settings.locale)?.label ?? "English"}</span>
                  <svg className={`custom-select-chevron${langOpen ? " open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {langOpen && (
                  <div className="custom-select-menu">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        className={`custom-select-option${settings.locale === lang.code ? " active" : ""}`}
                        onClick={() => { onChange({ ...settings, locale: lang.code }); setLangOpen(false); }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {section === "updates" && (
          <div className="settings-section">
            <h2>{t("settings.updatesTitle")}</h2>
            <p className="settings-desc">{t("settings.updatesDesc")}</p>

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
                    {updateStatus === "checking" ? t("settings.checking") : t("settings.checkUpdates")}
                  </button>
                  {version && <p className="settings-version">{t("settings.currentVersion", { version })}</p>}
                  {updateStatus === "up-to-date" && <p className="settings-version settings-success">{t("settings.upToDate")}</p>}
                  {updateStatus === "error" && <p className="settings-version settings-error">{t("settings.checkFailed")}</p>}
                </div>

                <hr className="settings-separator" />

                <div className="settings-group">
                  <div className="settings-toggle">
                    <div>
                      <div className="settings-toggle-label">{t("settings.autoUpdate")}</div>
                      <div className="settings-toggle-desc">{t("settings.autoUpdateDesc")}</div>
                    </div>
                    <button className={`toggle-switch${settings.autoUpdate ? " on" : ""}`} onClick={() => setAutoUpdate(!settings.autoUpdate)} />
                  </div>
                </div>

                <div className="settings-group">
                  <label>{t("settings.updateChannel")}</label>
                  <div className="settings-btn-group">
                    {(["release", "prerelease", "all"] as const).map((ch) => (
                      <button key={ch} className={`settings-btn${settings.updateChannel === ch ? " active" : ""}`} onClick={() => setUpdateChannel(ch)}>
                        {ch === "release" ? t("settings.channelStable") : ch === "prerelease" ? t("settings.channelPrerelease") : t("settings.channelAll")}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!window.electronAPI && (
              <p className="settings-version">{t("settings.updatesDesktopOnly")}</p>
            )}
          </div>
        )}

        {section === "advanced" && (
          <div className="settings-section">
            <h2>{t("settings.advancedTitle")}</h2>
            <p className="settings-desc">{t("settings.advancedDesc")}</p>

            <div className="settings-group">
              <label>{t("settings.projectsPath")}</label>
              <input
                className="settings-input"
                type="text"
                value={settings.projectsPath}
                onChange={(e) => setProjectsPath(e.target.value)}
                spellCheck={false}
              />
              <p className="settings-input-hint">{t("settings.projectsPathHint")}</p>
            </div>
          </div>
        )}

        {section === "about" && (
          <div className="settings-section">
            <h2>{t("settings.aboutTitle")}</h2>
            <p className="settings-desc">{t("settings.aboutDesc")}</p>
            <div className="settings-group">
              <h4>{t("settings.credits")}</h4>
              <p className="settings-version">{t("settings.madeBy", { author: "xAlcahest" })}</p>
              <p className="settings-version">{t("settings.builtWith")}</p>
              <p className="settings-version">{t("settings.license", { license: "MIT" })}</p>
              {version && <p className="settings-version">{t("settings.currentVersion", { version })}</p>}
              <p className="settings-version">
                <a href="https://github.com/xAlcahest/ccusage-monitor-gui" target="_blank" rel="noopener noreferrer" className="settings-link">
                  {t("settings.sourceCode")}
                </a>
              </p>
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

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
