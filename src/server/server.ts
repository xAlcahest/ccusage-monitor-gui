import path from "node:path";
import fs from "node:fs";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "node:http";
import type { UsageAggregator } from "./aggregator.js";

interface ServerOptions {
  aggregator: UsageAggregator;
  port: number;
  onUpdateModeChange: (intervalMs: number) => void;
}

export function createServer({ aggregator, port, onUpdateModeChange }: ServerOptions) {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  app.get("/api/usage", (_req, res) => {
    res.json(aggregator.getDashboardData());
  });

  app.get("/api/usage/projects", (_req, res) => {
    res.json(aggregator.getProjectRows());
  });

  const currentDir = import.meta.dirname ?? __dirname;
  const distClient = currentDir.includes("dist")
    ? path.resolve(currentDir, "../client")
    : path.resolve(currentDir, "../../dist/client");
  if (fs.existsSync(distClient)) {
    app.use(express.static(distClient));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distClient, "index.html"));
    });
  }

  wss.on("connection", (ws) => {
    ws.send(
      JSON.stringify({
        type: "snapshot",
        data: aggregator.getDashboardData(),
        projectRows: aggregator.getProjectRows(),
        modelRows: aggregator.getModelRows(),
      }),
    );

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "setUpdateMode" && typeof msg.intervalMs === "number") {
          onUpdateModeChange(msg.intervalMs);
        }
      } catch { /* ignore malformed messages */ }
    });
  });

  function broadcast() {
    const msg = JSON.stringify({
      type: "update",
      data: aggregator.getDashboardData(),
      projectRows: aggregator.getProjectRows(),
      modelRows: aggregator.getModelRows(),
    });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  server.listen(port, () => {
    console.log(`Dashboard: http://localhost:${port}`);
  });

  return { server, broadcast };
}
