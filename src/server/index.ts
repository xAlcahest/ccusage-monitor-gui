import os from "node:os";
import path from "node:path";
import { UsageAggregator } from "./aggregator.js";
import { parseFileIncremental } from "./parser.js";
import { startWatcher } from "./watcher.js";
import { createServer } from "./server.js";

const claudePath = path.join(os.homedir(), ".claude");
const port = parseInt(process.env.PORT ?? "3456", 10);

const aggregator = new UsageAggregator();
let debounceMs = 100;

const { broadcast } = createServer({
  aggregator,
  port,
  onUpdateModeChange: (intervalMs) => {
    debounceMs = intervalMs;
  },
});

let updateTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleUpdate() {
  if (updateTimer) clearTimeout(updateTimer);
  updateTimer = setTimeout(() => {
    broadcast();
    updateTimer = null;
  }, debounceMs);
}

let filesProcessed = 0;

startWatcher(claudePath, async (filePath: string) => {
  const result = await parseFileIncremental(filePath);

  for (const entry of result.added) {
    aggregator.addEntry(entry);
  }
  for (const { old: oldEntry, new: newEntry } of result.replaced) {
    aggregator.replaceEntry(oldEntry, newEntry);
  }

  if (result.added.length > 0 || result.replaced.length > 0) {
    filesProcessed++;
    scheduleUpdate();
  }
});

process.on("SIGINT", () => {
  console.log(`\nProcessed ${filesProcessed} file updates. Shutting down.`);
  process.exit(0);
});
