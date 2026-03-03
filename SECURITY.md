# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest release | Yes |
| Older versions | No |

Only the latest release receives security updates.

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please report them privately via [GitHub Security Advisories](https://github.com/xAlcahest/ccusage-monitor-gui/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive an initial response within 72 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Scope

This application reads Claude Code JSONL usage logs from `~/.claude/projects/` and displays them in a local dashboard. It does not transmit data externally (except for auto-update checks to GitHub Releases).

Security-relevant areas:
- **File system access**: the watcher reads files from the configured projects path
- **IPC/WebSocket**: local communication between Electron main process and renderer
- **Auto-updater**: downloads updates from GitHub Releases over HTTPS
