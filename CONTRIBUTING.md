# Contributing to ccusage-monitor-gui

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Run in development mode: `npm run dev`

## Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Electron + Vite hot reload |
| `npm run dev:web` | Web-only mode (Express + WebSocket on localhost:3456) |
| `npm run build` | Production build (Vite + TypeScript) |
| `npm run dist` | Build + electron-builder (outputs to `release/`) |

### Architecture

The app has three layers:

- **Electron main** (`src/electron/`) — BrowserWindow, IPC, data pipeline
- **React client** (`src/client/`) — Vite-bundled React 19 app
- **Server/backend** (`src/server/`) — Watcher, parser, aggregator (shared between Electron and web mode)

### Key things to know

- Vite HMR only covers the client. Server changes need a restart.
- All dates are stored as `YYYY-MM-DD` in local time.
- No persistence — everything is in-memory, re-parsed from JSONL on restart.
- Four separate tsconfigs exist because Electron requires mixed module systems (ESM + CommonJS for preload).

## Submitting Changes

1. Create a branch from `master`
2. Make your changes
3. Ensure `npm run build` passes with no errors
4. Open a pull request against `master`

### Commit Messages

- Use imperative mood ("Add feature", not "Added feature")
- Keep the first line under 72 characters
- Reference issue numbers where applicable

## Reporting Bugs

Use the [Bug Report](https://github.com/xAlcahest/ccusage-monitor-gui/issues/new?template=bug_report.yml) template.

## Requesting Features

Use the [Feature Request](https://github.com/xAlcahest/ccusage-monitor-gui/issues/new?template=feature_request.yml) template.
