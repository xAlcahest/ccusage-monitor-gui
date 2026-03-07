import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { UsageAggregator } from "../server/aggregator.js";
import { parseFileIncremental, resetParser } from "../server/parser.js";
import { startWatcher, type Watcher } from "../server/watcher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";
const DEV_URL = "http://localhost:5173";

// Ensure Electron runs as Electron, not as Node
delete process.env.ELECTRON_RUN_AS_NODE;

app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
const aggregator = new UsageAggregator();
let currentWatcher: Watcher | null = null;
let debounceMs = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const fileLocks = new Map<string, Promise<void>>();

function broadcastUpdate() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("dashboard:update", {
    data: aggregator.getDashboardData(),
    projectRows: aggregator.getProjectRows(),
    modelRows: aggregator.getModelRows(),
    hourlyRows: aggregator.getHourlyRows(),
    hourlyProjectRows: aggregator.getHourlyProjectRows(),
    hourlyModelRows: aggregator.getHourlyModelRows(),
  });
}

function scheduleUpdate() {
  if (debounceMs === 0) {
    broadcastUpdate();
    return;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    broadcastUpdate();
    debounceTimer = null;
  }, debounceMs);
}

function processFile(filePath: string) {
  const prev = fileLocks.get(filePath) ?? Promise.resolve();
  const next = prev.then(async () => {
    const result = await parseFileIncremental(filePath);
    for (const entry of result.added) {
      aggregator.addEntry(entry);
    }
    for (const { old: oldEntry, new: newEntry } of result.replaced) {
      aggregator.replaceEntry(oldEntry, newEntry);
    }
    if (result.added.length > 0 || result.replaced.length > 0) {
      scheduleUpdate();
    }
  });
  fileLocks.set(filePath, next);
}

async function waitForDevServer(url: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.error("Vite dev server not ready after 30s — exiting.");
  app.quit();
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    title: "Claude Code Usage Monitor",
    icon: path.join(__dirname, "..", "..", "build", "icon.png"),
    backgroundColor: "#0f1117",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    await waitForDevServer(DEV_URL);
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "client", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window:maximize-change", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window:maximize-change", false);
  });
}

// Window controls
ipcMain.on("window:minimize", () => mainWindow?.minimize());
ipcMain.on("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on("window:close", () => mainWindow?.close());
ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);

// App info
ipcMain.handle("app:version", () => app.getVersion());

// Open external URLs in default browser
ipcMain.on("shell:openExternal", (_event, url: string) => {
  if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
    shell.openExternal(url);
  }
});

// Renderer ready — send initial snapshot
ipcMain.on("dashboard:ready", () => {
  broadcastUpdate();
});

// Messages from renderer
ipcMain.on("app:message", (_event, msg) => {
  if (msg?.type === "setUpdateMode" && typeof msg.intervalMs === "number") {
    debounceMs = msg.intervalMs;
  }
  if (msg?.type === "setAutoUpdate" && typeof msg.enabled === "boolean") {
    if (msg.enabled) {
      startAutoUpdateTimer();
    } else {
      stopAutoUpdateTimer();
    }
  }
  if (msg?.type === "setUpdateChannel" && typeof msg.channel === "string") {
    setAllowPrerelease?.(msg.channel !== "release");
  }
  if (msg?.type === "setProjectsPath" && typeof msg.path === "string") {
    const resolved = msg.path.replace(/^~/, os.homedir());
    if (!fs.existsSync(resolved)) return;
    // startWatcher expects the parent dir (it appends "projects/" internally)
    const parentDir = resolved.replace(/\/projects\/?$/, "");
    currentWatcher?.close();
    aggregator.clear();
    resetParser();
    fileLocks.clear();
    currentWatcher = startWatcher(parentDir, (filePath) => processFile(filePath));
    broadcastUpdate();
  }
});

// Auto-updater (gracefully fails if electron-updater not available)
// Uses pkexec + dnf for RPM installation so the user gets a polkit password prompt.

let checkForUpdates: (() => void) | null = null;
let setAllowPrerelease: ((allow: boolean) => void) | null = null;
let autoUpdateTimer: ReturnType<typeof setInterval> | null = null;

function startAutoUpdateTimer() {
  stopAutoUpdateTimer();
  autoUpdateTimer = setInterval(() => {
    checkForUpdates?.();
  }, 30 * 60 * 1000);
}

function stopAutoUpdateTimer() {
  if (autoUpdateTimer) {
    clearInterval(autoUpdateTimer);
    autoUpdateTimer = null;
  }
}

async function setupAutoUpdater() {
  try {
    const { autoUpdater } = await import("electron-updater");
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false; // We handle install manually via pkexec + dnf

    setAllowPrerelease = (allow: boolean) => {
      autoUpdater.allowPrerelease = allow;
    };

    let downloadedFilePath: string | null = null;

    autoUpdater.on("checking-for-update", () => {
      console.log("[updater] Checking for updates...");
      mainWindow?.webContents.send("update:checking");
    });

    autoUpdater.on("update-available", (info: { version: string }) => {
      console.log(`[updater] Update available: ${info.version}`);
      mainWindow?.webContents.send("update:available", info.version);
    });

    autoUpdater.on("update-not-available", () => {
      console.log("[updater] Already up to date");
      mainWindow?.webContents.send("update:not-available");
    });

    autoUpdater.on("error", (err: Error) => {
      console.error("[updater] Error:", err.message);
      mainWindow?.webContents.send("update:error", err.message);
    });

    autoUpdater.on("update-downloaded", (info: { downloadedFile: string }) => {
      downloadedFilePath = info.downloadedFile;
      console.log(`[updater] Downloaded: ${downloadedFilePath}`);
      mainWindow?.webContents.send("update:downloaded");
    });

    ipcMain.on("update:install", async () => {
      if (!downloadedFilePath) return;

      mainWindow?.webContents.send("update:installing");

      try {
        // Use pkexec for polkit password prompt, sh -c to run dnf.
        // Path passed as $1 (positional param) to avoid shell injection.
        // dnf flags:
        //   -y              non-interactive (pkexec handles auth)
        //   --best          ensure best available version
        //   --allowerasing  allow replacing conflicting packages
        //   --nogpgcheck    RPM from GitHub releases is unsigned
        //   --setopt=install_weak_deps=False  skip optional weak deps
        //   --                                end of options
        await execFileAsync("pkexec", [
          "sh", "-c",
          'dnf install -y --best --allowerasing --nogpgcheck --setopt=install_weak_deps=False -- "$1"',
          "_",
          downloadedFilePath,
        ]);

        app.relaunch();
        app.exit(0);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        mainWindow?.webContents.send("update:error", message);
      }
    });

    checkForUpdates = () => {
      autoUpdater.checkForUpdates().catch((err: Error) => {
        console.error("[updater] checkForUpdates failed:", err.message);
        mainWindow?.webContents.send("update:error", err.message);
      });
    };

    checkForUpdates();
  } catch (err) {
    console.log("[updater] electron-updater not available, skipping auto-update");
  }
}

// Always register IPC handler so it works even if setupAutoUpdater hasn't completed yet
ipcMain.on("update:check", () => {
  if (checkForUpdates) {
    checkForUpdates();
  } else {
    console.log("[updater] Auto-updater not initialized");
    mainWindow?.webContents.send("update:error", "Auto-updater not available");
  }
});

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    await createWindow();

    // Start backend data pipeline
    const claudePath = path.join(os.homedir(), ".claude");
    currentWatcher = startWatcher(claudePath, (filePath) => {
      processFile(filePath);
    });

    if (!isDev) setupAutoUpdater();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}
