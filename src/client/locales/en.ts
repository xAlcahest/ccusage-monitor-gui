export default {
  // Header
  "header.title": "Claude Code Usage Monitor",
  "header.updated": "Updated {{time}}",
  "header.reconnecting": "Reconnecting...",
  "header.settings": "Settings",

  // Time ago
  "time.justNow": "just now",
  "time.secondsAgo": "{{count}}s ago",
  "time.minutesAgo": "{{count}}m ago",
  "time.hoursAgo": "{{count}}h ago",

  // Titlebar
  "titlebar.minimize": "Minimize",
  "titlebar.maximize": "Maximize",
  "titlebar.restore": "Restore",
  "titlebar.close": "Close",

  // Date range filter
  "range.label": "Range:",
  "range.all": "All time",
  "range.monthly": "Monthly",
  "range.thisMonth": "This month",
  "range.today": "Today",

  // View toggle
  "view.label": "View:",
  "view.byDay": "By Day",
  "view.byProject": "By Project",

  // Aggregation toggle
  "aggregation.label": "Show by:",
  "aggregation.years": "Years",
  "aggregation.days": "Days",

  // Today mode toggle
  "todayMode.label": "Detail:",
  "todayMode.day": "Day",
  "todayMode.hourly": "Hourly",

  // Update mode
  "updateMode.label": "Updates:",

  // Table headers
  "table.hour": "Hour",
  "table.date": "Date",
  "table.projects": "Projects",
  "table.models": "Models",
  "table.input": "Input",
  "table.output": "Output",
  "table.cacheCreate": "Cache Create",
  "table.cacheRead": "Cache Read",
  "table.total": "Total",
  "table.cost": "Cost",
  "table.empty": "No usage data for this range.",

  // Chart titles
  "chart.cost": "{{period}} Cost",
  "chart.tokenBreakdown": "{{period}} Token Breakdown",
  "chart.modelUsage": "{{period}} Model Usage",

  // Period labels
  "period.hourly": "Hourly",
  "period.daily": "Daily",
  "period.monthly": "Monthly",
  "period.yearly": "Yearly",

  // Chart legend / tooltip
  "chart.inputTokens": "Input",
  "chart.outputTokens": "Output",
  "chart.cacheCreateTokens": "Cache Create",
  "chart.cacheReadTokens": "Cache Read",
  "chart.costLabel": "Cost",

  // Project leaderboard
  "leaderboard.title": "Project Leaderboard",
  "leaderboard.in": "In:",
  "leaderboard.out": "Out:",
  "leaderboard.cc": "CC:",
  "leaderboard.cr": "CR:",
  "leaderboard.tot": "Tot:",
  "leaderboard.inputTokens": "Input tokens",
  "leaderboard.outputTokens": "Output tokens",
  "leaderboard.cacheCreate": "Cache create",
  "leaderboard.cacheRead": "Cache read",
  "leaderboard.totalTokens": "Total tokens",

  // Project sidebar
  "sidebar.title": "Projects Leaderboard",
  "sidebar.empty": "No projects",
  "sidebar.expand": "Expand sidebar",
  "sidebar.collapse": "Collapse sidebar",

  // Settings
  "settings.appearance": "Appearance",
  "settings.updates": "Updates",
  "settings.advanced": "Advanced",
  "settings.close": "Close (Esc)",

  "settings.appearanceTitle": "Appearance",
  "settings.appearanceDesc": "Customize how the app looks.",
  "settings.theme": "Theme",
  "settings.themeAuto": "Auto",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",
  "settings.animateNumbers": "Animated numbers",
  "settings.animateNumbersDesc": "Slot machine style rolling digits when values change",
  "settings.language": "Language",

  "settings.updatesTitle": "Updates",
  "settings.updatesDesc": "Manage application updates.",
  "settings.checkUpdates": "Check for updates",
  "settings.checking": "Checking...",
  "settings.currentVersion": "Current version: v{{version}}",
  "settings.upToDate": "You're up to date!",
  "settings.checkFailed": "Failed to check for updates.",
  "settings.autoUpdate": "Automatic updates",
  "settings.autoUpdateDesc": "Check for updates every 30 minutes",
  "settings.updateChannel": "Update channel",
  "settings.channelStable": "Stable",
  "settings.channelPrerelease": "Pre-release",
  "settings.channelAll": "All",
  "settings.updatesDesktopOnly": "Updates are only available in the desktop app.",

  "settings.advancedTitle": "Advanced",
  "settings.advancedDesc": "Advanced configuration options.",
  "settings.projectsPath": "Claude Projects Path",
  "settings.projectsPathHint": "Directory where Claude Code stores project data. Requires restart to take effect.",

  // Update banner
  "update.downloading": "Downloading update v{{version}}...",
  "update.ready": "v{{version}} ready to install.",
  "update.restartAndUpdate": "Restart & Update",
  "update.installing": "Installing v{{version}} via dnf... (check polkit prompt)",
  "update.failed": "Update failed",
  "update.failedWithError": "Update failed: {{error}}",
  "update.retry": "Retry",


  "settings.about": "About",
  "settings.aboutTitle": "About",
  "settings.aboutDesc": "Application info and credits.",
  "settings.credits": "Credits",
  "settings.madeBy": "Made by {{author}}",
  "settings.builtWith": "Built with Electron, React, and TypeScript",
  "settings.license": "License: {{license}}",
  "settings.sourceCode": "Source code",
} as const;
