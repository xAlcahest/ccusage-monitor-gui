import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  onDashboardUpdate: (callback: (payload: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: unknown) =>
      callback(payload);
    ipcRenderer.on("dashboard:update", handler);
    return () => {
      ipcRenderer.removeListener("dashboard:update", handler);
    };
  },

  send: (message: unknown) => {
    ipcRenderer.send("app:message", message);
  },

  ready: () => ipcRenderer.send("dashboard:ready"),

  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),

  onMaximizeChange: (callback: (maximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, maximized: boolean) =>
      callback(maximized);
    ipcRenderer.on("window:maximize-change", handler);
    return () => {
      ipcRenderer.removeListener("window:maximize-change", handler);
    };
  },

  getVersion: () => ipcRenderer.invoke("app:version"),

  onUpdateAvailable: (callback: (version: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, version: string) =>
      callback(version);
    ipcRenderer.on("update:available", handler);
    return () => {
      ipcRenderer.removeListener("update:available", handler);
    };
  },

  onUpdateDownloaded: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on("update:downloaded", handler);
    return () => {
      ipcRenderer.removeListener("update:downloaded", handler);
    };
  },

  onUpdateInstalling: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on("update:installing", handler);
    return () => {
      ipcRenderer.removeListener("update:installing", handler);
    };
  },

  onUpdateError: (callback: (message: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, message: string) =>
      callback(message);
    ipcRenderer.on("update:error", handler);
    return () => {
      ipcRenderer.removeListener("update:error", handler);
    };
  },

  installUpdate: () => ipcRenderer.send("update:install"),
  checkForUpdate: () => ipcRenderer.send("update:check"),
});
