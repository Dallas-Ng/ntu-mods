// The clients the MCP page has setup steps for, in tab order. The tabs and the
// side nav both read this, so a tab id is also the `?agent=` value.
export const MCP_CLIENTS = [
  { id: "claude-desktop", label: "Claude Desktop" },
  { id: "claude-code", label: "Claude Code" },
  { id: "chatgpt-codex", label: "ChatGPT & Codex" },
  { id: "cursor", label: "Cursor" },
  { id: "vscode", label: "VS Code" },
  { id: "others", label: "Other tools" }
] as const
