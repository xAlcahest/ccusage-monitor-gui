import fs from "node:fs";
import path from "node:path";
import { watch } from "chokidar";

export interface Watcher {
  close: () => void;
}

export function startWatcher(
  claudePath: string,
  onFileChanged: (filePath: string) => void,
): Watcher {
  const projectsDir = path.join(claudePath, "projects");
  const knownSizes = new Map<string, number>();

  function handleFile(filePath: string) {
    try {
      const size = fs.statSync(filePath).size;
      if (size === knownSizes.get(filePath)) return;
      knownSizes.set(filePath, size);
    } catch {
      return;
    }
    onFileChanged(filePath);
  }

  // Primary: native fs events (inotify on Linux) — instant (<1ms)
  const fsWatcher = watch(projectsDir, {
    persistent: true,
    ignoreInitial: false,
    depth: 5,
    ignored: (filePath: string) => {
      if (filePath === projectsDir) return false;
      const ext = path.extname(filePath);
      if (ext && ext !== ".jsonl") return true;
      return false;
    },
  });

  fsWatcher
    .on("add", (fp) => {
      if (fp.endsWith(".jsonl")) handleFile(fp);
    })
    .on("change", (fp) => {
      if (fp.endsWith(".jsonl")) handleFile(fp);
    });

  // Fallback: fast stat-poll every 100ms catches anything inotify missed
  const pollTimer = setInterval(() => {
    for (const [fp, lastSize] of knownSizes) {
      try {
        const size = fs.statSync(fp).size;
        if (size > lastSize) {
          knownSizes.set(fp, size);
          onFileChanged(fp);
        }
      } catch {}
    }
  }, 100);

  return {
    close() {
      clearInterval(pollTimer);
      fsWatcher.close();
    },
  };
}
