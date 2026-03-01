import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import type { AssistantRecord, UsageEntry } from "./types.js";
import { calculateCost } from "./pricing.js";

interface FileState {
  byteOffset: number;
  cwd: string | null;
}

const fileStates = new Map<string, FileState>();
const seenRequests = new Map<string, UsageEntry>();

const projectRootCache = new Map<string, string>();

function resolveProjectRoot(cwd: string): string {
  const cached = projectRootCache.get(cwd);
  if (cached) return cached;

  let dir = cwd;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) {
      projectRootCache.set(cwd, dir);
      return dir;
    }
    dir = path.dirname(dir);
  }

  projectRootCache.set(cwd, cwd);
  return cwd;
}

function decodeProjectDirName(encoded: string): string {
  if (!encoded.startsWith("-")) return encoded;
  const parts = encoded.slice(1).split("-");
  let current = "/";
  let i = 0;

  while (i < parts.length) {
    let found = false;
    for (let j = parts.length; j > i; j--) {
      const candidate = parts.slice(i, j).join("-");
      const testPath = path.join(current, candidate);
      if (fs.existsSync(testPath)) {
        current = testPath;
        i = j;
        found = true;
        break;
      }
    }
    if (!found) {
      current = path.join(current, parts.slice(i).join("-"));
      break;
    }
  }

  return current;
}

function fallbackProject(filePath: string): string {
  const projectsDir = path.join(
    process.env.HOME ?? "",
    ".claude",
    "projects",
  );
  const relative = path.relative(projectsDir, filePath);
  const encoded = relative.split(path.sep)[0];
  return decodeProjectDirName(encoded);
}

function makeDedupKey(record: AssistantRecord): string {
  const msgId = record.message.id ?? "";
  const rid = record.requestId ?? "";
  if (msgId && rid) return `${msgId}:${rid}`;
  return `${msgId || rid}:${record.timestamp}`;
}

function recordToEntry(
  record: AssistantRecord,
  project: string,
  dedupKey: string,
): UsageEntry {
  const model = record.message.model ?? "unknown";
  const usage = record.message.usage;
  return {
    requestId: dedupKey,
    timestamp: record.timestamp,
    model,
    project,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cost: calculateCost(model, usage),
  };
}

export interface ParseResult {
  added: UsageEntry[];
  replaced: Array<{ old: UsageEntry; new: UsageEntry }>;
}

export async function parseFileIncremental(
  filePath: string,
): Promise<ParseResult> {
  const result: ParseResult = { added: [], replaced: [] };

  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return result;
  }

  const state = fileStates.get(filePath) ?? { byteOffset: 0, cwd: null };

  if (stat.size < state.byteOffset) {
    state.byteOffset = 0;
    state.cwd = null;
    clearFileEntries(filePath);
  }

  if (stat.size <= state.byteOffset) return result;

  const stream = fs.createReadStream(filePath, {
    start: state.byteOffset,
    encoding: "utf-8",
  });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let bytesRead = state.byteOffset;

  for await (const line of rl) {
    bytesRead += Buffer.byteLength(line, "utf-8") + 1;
    if (!line.trim()) continue;

    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }

    // Pick up cwd from any record that has it
    if (typeof obj.cwd === "string" && !state.cwd) {
      state.cwd = obj.cwd;
    }

    const record = obj as unknown as AssistantRecord;
    if (!record.message?.usage) continue;
    if (!record.message.model || record.message.model.startsWith("<")) continue;
    if (!record.timestamp) continue;

    // Use cwd from this record, or cached from earlier records, or fallback
    const rawProject = record.cwd ?? state.cwd ?? fallbackProject(filePath);
    const project = resolveProjectRoot(rawProject);

    const key = makeDedupKey(record);
    if (seenRequests.has(key)) continue;

    const entry = recordToEntry(record, project, key);
    seenRequests.set(key, entry);
    result.added.push(entry);
  }

  state.byteOffset = bytesRead;
  fileStates.set(filePath, state);

  return result;
}

function clearFileEntries(filePath: string): void {
  const state = fileStates.get(filePath);
  const project = state?.cwd ?? fallbackProject(filePath);
  for (const [key, entry] of seenRequests) {
    if (entry.project === project) {
      seenRequests.delete(key);
    }
  }
}

export function resetParser(): void {
  fileStates.clear();
  seenRequests.clear();
  projectRootCache.clear();
}
