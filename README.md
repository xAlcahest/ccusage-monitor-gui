# Claude Code Usage Monitor

Real-time desktop dashboard for monitoring Claude Code token usage, costs, and model distribution across all your projects.

![Electron](https://img.shields.io/badge/Electron-35-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)

## Features

- **Real-time monitoring** — live token tracking as you use Claude Code, powered by file watching + WebSocket
- **Per-project breakdown** — see usage and costs grouped by project with a horizontal leaderboard
- **Model distribution** — pie chart showing which models you're using, filtered by date range
- **Token breakdown** — separate bars for input, output, cache creation, and cache read tokens
- **Cost tracking** — daily cost chart with running totals
- **Date range filters** — Today, Last 7 days, This month, Last 30 days, All time
- **Daily / Project views** — toggle between aggregated daily view and per-project view
- **Month-based row coloring** — subtle alternating colors per month in the usage table
- **Custom titlebar** — frameless window with native-feeling controls
- **Auto-updater** — built-in update mechanism via electron-updater

## How it works

The app watches `~/.claude/projects/` for JSONL conversation files. When Claude Code writes new entries, the file watcher detects changes instantly (inotify + stat-poll fallback) and the aggregator updates token counts, costs, and model stats in real time.

## Getting started

```bash
# Install dependencies
npm install

# Development (Electron + Vite hot reload)
npm run dev

# Web-only development (Express + WebSocket on localhost)
npm run dev:web

# Production build
npm run build

# Create distributable (AppImage / deb)
npm run dist
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 35 |
| Frontend | React 19 + Vite |
| Charts | Recharts |
| Backend | Express + WebSocket (ws) |
| File watching | Chokidar (hybrid inotify + polling) |
| Build | TypeScript, electron-builder |

## Project structure

```
src/
  client/           # React frontend
    components/     # UI components (charts, table, filters, titlebar)
    hooks/          # useWebSocket, useUsageData
    types.ts        # Shared client types
    utils.ts        # Date filtering, formatting
  electron/         # Electron main + preload
    main.ts         # BrowserWindow, IPC, watcher setup
    preload.ts      # contextBridge API
  server/           # Backend logic (shared between Electron and web mode)
    aggregator.ts   # Token/cost aggregation engine
    parser.ts       # JSONL conversation file parser
    watcher.ts      # Hybrid file watcher
    pricing.ts      # Claude model pricing table
    server.ts       # Express + WebSocket server (web mode)
build/
  icon.png          # App icon (512x512)
  icon.ico          # Windows icon
  icon.svg          # Icon source
```

## License

Private project.
