interface HeaderProps {
  connected: boolean;
  lastUpdated: string | null;
}

export function Header({ connected, lastUpdated }: HeaderProps) {
  const timeAgo = lastUpdated ? getTimeAgo(lastUpdated) : "—";

  return (
    <header className="header">
      <div className="header-left">
        <h1>Claude Code Usage Monitor</h1>
      </div>
      <div className="header-right">
        <span className={`status-dot ${connected ? "connected" : "disconnected"}`} />
        <span className="status-text">
          {connected ? `Updated ${timeAgo}` : "Reconnecting..."}
        </span>
      </div>
    </header>
  );
}

function getTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
