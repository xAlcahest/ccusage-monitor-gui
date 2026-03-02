interface ElectronAPI {
  onDashboardUpdate: (
    callback: (payload: {
      data: import("./types").DashboardData;
      projectRows: import("./types").DashboardRow[];
      modelRows: import("./types").DashboardRow[];
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
  onUpdateAvailable: (callback: (version: string) => void) => () => void;
  onUpdateDownloaded: (callback: () => void) => () => void;
  installUpdate: () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
