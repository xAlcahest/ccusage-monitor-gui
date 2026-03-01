import { useEffect, useRef, useCallback, useState } from "react";
import type { DashboardData, DashboardRow, WSMessage } from "../types";

interface UseWebSocketResult {
  data: DashboardData | null;
  projectRows: DashboardRow[];
  modelRows: DashboardRow[];
  connected: boolean;
  send: (msg: unknown) => void;
}

export function useWebSocket(): UseWebSocketResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [projectRows, setProjectRows] = useState<DashboardRow[]>([]);
  const [modelRows, setModelRows] = useState<DashboardRow[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectDelayRef = useRef(1000);
  const sendRef = useRef<(msg: unknown) => void>(() => {});

  useEffect(() => {
    // Electron IPC mode
    if (window.electronAPI) {
      setConnected(true);
      sendRef.current = (msg) => window.electronAPI!.send(msg);
      const cleanup = window.electronAPI.onDashboardUpdate((payload) => {
        setData(payload.data);
        setProjectRows(payload.projectRows);
        setModelRows(payload.modelRows);
      });
      window.electronAPI.ready();
      return cleanup;
    }

    // WebSocket mode (browser / npm run dev)
    sendRef.current = (msg) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
      }
    };

    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectDelayRef.current = 1000;
      };

      ws.onmessage = (event) => {
        const msg: WSMessage = JSON.parse(event.data);
        setData(msg.data);
        setProjectRows(msg.projectRows);
        setModelRows(msg.modelRows);
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        reconnectTimerRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            10000,
          );
          connect();
        }, reconnectDelayRef.current);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((msg: unknown) => sendRef.current(msg), []);

  return { data, projectRows, modelRows, connected, send };
}
