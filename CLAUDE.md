# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev          # Electron + Vite hot reload (compiles all tsconfigs, then concurrently runs Vite + Electron)
npm run dev:web      # Web-only mode (Express + WebSocket on localhost:3456, tsx --watch)
npm run build        # Production: vite build → tsc server → tsc electron → tsc preload
npm run dist         # Build + electron-builder (outputs to release/)
```

## Architecture

Three layers sharing a single codebase, deployable as Electron desktop app or web server:

**Electron main** (`src/electron/main.ts`) — frameless BrowserWindow, IPC handlers, runs the data pipeline (watcher → parser → aggregator → broadcast via `webContents.send`).

**React client** (`src/client/`) — Vite-bundled React 19 app. `useWebSocket()` hook auto-detects mode: Electron IPC when `window.electronAPI` exists, real WebSocket otherwise. `useUsageData()` filters/aggregates data client-side based on date range, view mode, aggregation mode.

**Server/backend** (`src/server/`) — shared between both modes. Watcher (Chokidar, hybrid inotify + 100ms polling) monitors `~/.claude/projects/` for JSONL changes. Parser reads incrementally (tracks byte offset per file). Aggregator maintains three in-memory Maps (daily totals, daily-by-project, daily-by-model).

**Data flow:** File change → Watcher → `parseFileIncremental()` → `aggregator.addEntry()/replaceEntry()` → debounced broadcast → IPC or WebSocket → React state update.

## TypeScript Setup

Four separate tsconfigs exist because Electron requires mixed module systems:

- **tsconfig.json** — base config (no emit), covers all `src/` for IDE
- **tsconfig.server.json** — `src/server/` → `dist/server/` (ESM)
- **tsconfig.electron.json** — `src/electron/main.ts` + `src/server/` → `dist/` (ESM)
- **tsconfig.preload.json** — `src/electron/preload.ts` → `dist/electron/` (**CommonJS**, required by Electron sandbox)

## Key Patterns

- **Dual IPC/WebSocket communication**: same `useWebSocket()` hook handles both modes transparently. Electron uses IPC channels (`dashboard:update`, `dashboard:ready`, `app:message`), web uses WebSocket with exponential backoff reconnect.
- **Stateful incremental parser**: `fileStates` Map tracks byte offset + cwd per file. `seenRequests` deduplicates by `message.id:requestId`. If file shrinks (truncated), offset resets to 0 and entries are cleared.
- **File lock queue**: Electron main serializes per-file processing via Promise chain to prevent concurrent aggregator mutations.
- **Update debouncing**: configurable interval (0 = immediate in Electron, 100ms in web mode). User can change via `setUpdateMode` message.
- **Project path resolution**: decodes hyphen-encoded directory names, searches for `.git` root from cwd, falls back to directory name parsing.
- **Auto-updater on Linux**: uses `pkexec` + `dnf` for privileged RPM install (polkit prompt), not the standard `quitAndInstall`.

## Gotchas

- `package.json` has `"type": "module"` but preload must be CommonJS — hence the separate tsconfig.
- Vite HMR only covers the client. Server changes need restart (use `dev:web` + tsx for server work).
- All dates stored as `YYYY-MM-DD` local time. Timestamps from Claude are UTC, silently converted to local date.
- No persistence — everything in-memory, re-parsed from JSONL on restart.
- Hardware acceleration disabled (`app.disableHardwareAcceleration()`) to avoid Electron GPU issues.
- Records with model starting with `<` are skipped.
- electron-builder output goes to `release/` (not default `dist/`, which holds compiled TS).
