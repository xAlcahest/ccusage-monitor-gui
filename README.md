# Claude Code Usage Monitor

Real-time desktop dashboard for monitoring Claude Code token usage, costs, and model distribution across all your projects.

![Electron](https://img.shields.io/badge/Electron-35-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Live monitoring** — real-time token tracking as you use Claude Code, with per-model glow animations on active usage
- **Per-project breakdown** — usage and costs grouped by project via sidebar and leaderboard
- **Model distribution** — line chart showing token usage per model over time
- **Token breakdown** — input, output, cache creation, and cache read tokens charted separately
- **Cost tracking** — daily/monthly/yearly cost trends
- **Flexible date ranges** — All time (by year/day), Monthly, This month, Today
- **Daily / Project views** — toggle between aggregated daily and per-project table views
- **European date format** — DD/MM/YYYY throughout
- **Custom titlebar** — frameless Electron window with native-feeling controls
- **Auto-updater** — built-in updates via GitHub Releases (RPM via pkexec + dnf)

## Download

Grab the latest release for your platform from the [Releases](https://github.com/xAlcahest/ccusage-monitor-gui/releases) page:

| Platform | Format |
|----------|--------|
| Linux | `.deb` `.rpm` `.AppImage` `.tar.gz` |
| Windows | `.exe` (NSIS installer) |

## How it works

The app watches `~/.claude/projects/` for JSONL conversation files. When Claude Code writes new entries, the file watcher detects changes instantly (inotify + stat-poll fallback) and the aggregator updates token counts, costs, and model stats in real time.

## Development

```bash
# Install dependencies
npm install

# Development (Electron + Vite hot reload)
npm run dev

# Web-only development (Express + WebSocket on localhost)
npm run dev:web

# Production build
npm run build

# Create distributable
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
| CI/CD | GitHub Actions |

## Project structure

```
src/
  client/           # React frontend
    components/     # UI components (charts, table, filters, sidebar, titlebar)
    hooks/          # useWebSocket, useUsageData
    types.ts        # Shared client types
    utils.ts        # Date filtering, formatting, aggregation
  electron/         # Electron main + preload
    main.ts         # BrowserWindow, IPC, auto-updater, watcher setup
    preload.ts      # contextBridge API
  server/           # Backend logic (shared between Electron and web mode)
    aggregator.ts   # Token/cost aggregation engine
    parser.ts       # JSONL conversation file parser
    watcher.ts      # Hybrid file watcher
    pricing.ts      # Claude model pricing table
    server.ts       # Express + WebSocket server (web mode)
```

## License

MIT
