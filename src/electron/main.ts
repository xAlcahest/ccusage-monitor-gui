import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { UsageAggregator } from "../server/aggregator.js";
import { parseFileIncremental } from "../server/parser.js";
import { startWatcher } from "../server/watcher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";
const DEV_URL = "http://localhost:5173";

// Ensure Electron runs as Electron, not as Node
delete process.env.ELECTRON_RUN_AS_NODE;

app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
const aggregator = new UsageAggregator();
let debounceMs = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const fileLocks = new Map<string, Promise<void>>();

function broadcastUpdate() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("dashboard:update", {
    data: aggregator.getDashboardData(),
    projectRows: aggregator.getProjectRows(),
    modelRows: aggregator.getModelRows(),
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

// Renderer ready — send initial snapshot
ipcMain.on("dashboard:ready", () => {
  broadcastUpdate();
});

// Messages from renderer
ipcMain.on("app:message", (_event, msg) => {
  if (msg?.type === "setUpdateMode" && typeof msg.intervalMs === "number") {
    debounceMs = msg.intervalMs;
  }
});

// Auto-updater (gracefully fails if electron-updater not available)
async function setupAutoUpdater() {
  try {
    const { autoUpdater } = await import("electron-updater");
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("update-available", (info: { version: string }) => {
      mainWindow?.webContents.send("update:available", info.version);
    });

    autoUpdater.on("update-downloaded", () => {
      mainWindow?.webContents.send("update:downloaded");
    });

    autoUpdater.checkForUpdates().catch(() => {});
  } catch {
    // electron-updater not installed — skip auto-update
  }
}

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
    startWatcher(claudePath, (filePath) => {
      processFile(filePath);
    });

    if (!isDev) setupAutoUpdater();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}
