interface ElectronAPI {
  onDashboardUpdate: (
    callback: (payload: {
      data: import("./types").DashboardData;
      projectRows: import("./types").DashboardRow[];
      modelRows: import("./types").DashboardRow[];
      hourlyRows: import("./types").DashboardRow[];
      hourlyProjectRows: import("./types").DashboardRow[];
      hourlyModelRows: import("./types").DashboardRow[];
    }) => void,
  ) => () => void;
  send: (message: unknown) => void;
  ready: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (maximized: boolean) => void) => () => void;
  getVersion: () => Promise<string>;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (version: string) => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onUpdateDownloaded: (callback: () => void) => () => void;
  onUpdateInstalling: (callback: () => void) => () => void;
  onUpdateError: (callback: (message: string) => void) => () => void;
  installUpdate: () => void;
  checkForUpdate: () => void;
  openExternal: (url: string) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
