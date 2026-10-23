"use client"

import { Code } from "@/components/developers/code"

type Block =
  | { steps: React.ReactNode[] }
  | { code: string; lang: string; title?: string }
  | { note: React.ReactNode }
  | { heading: string }

type Props = {
  mcpUrl: string
  directoryUrl: string
  claudeCodeCommand: string
  claudeCodeUserCommand: string
  codexCommand: string
  codexToml: string
  cursorConfig: string
  vscodeConfig: string
  mcpRemoteCommand: string
}

const Blocks = ({ blocks }: { blocks: Block[] }) => (
  <div className="flex flex-col gap-3">
    {blocks.map((b, i) =>
      "steps" in b && b.steps.length === 1 ? (
        // a lone line is a lead-in to the block after it, not a numbered step
        <p key={i}>{b.steps[0]}</p>
      ) : "steps" in b ? (
        <ol key={i}>
          {b.steps.map((step, j) => (
            <li key={j}>{step}</li>
          ))}
        </ol>
      ) : "code" in b ? (
        <Code key={i} code={b.code} lang={b.lang} title={b.title} />
      ) : "heading" in b ? (
        <h3 key={i} className="pt-2">
          {b.heading}
        </h3>
      ) : (
        <p key={i} className="text-muted-foreground text-sm">
          {b.note}
        </p>
      )
    )}
  </div>
)

const McpClientSteps = ({ id, ...p }: Props & { id: string }) => {
  const clients: { id: string; label: string; blocks: Block[] }[] = [
    {
      id: "claude-desktop",
      label: "Claude Desktop",
      blocks: [
        {
          steps: [
            <>
              Open the{" "}
              <a href={p.directoryUrl} target="_blank" rel="noopener">
                NTUMods listing in the Claude directory
              </a>{" "}
              and choose to connect it.
            </>,
            "Start a chat, click the + button, open Connectors and check that NTUMods is turned on.",
            "Ask a question, for example “What is SC1004?”."
          ]
        },
        { note: "Not in the directory for your plan? Add it by hand:" },
        {
          steps: [
            "Go to Customize, then Connectors.",
            "Click Add custom connector.",
            <>
              Enter <code>NTUMods</code> as the name and <code>{p.mcpUrl}</code>{" "}
              as the server URL.
            </>,
            "Set Authentication to No sign-in, then click Add."
          ]
        },
        {
          note: "Free plans can add one custom connector. On Team and Enterprise plans an Owner adds it under Organization settings, then Connectors, and members connect it from Customize."
        }
      ]
    },
    {
      id: "claude-code",
      label: "Claude Code",
      blocks: [
        { steps: ["Run this command in your terminal."] },
        { code: p.claudeCodeCommand, lang: "bash" },
        {
          steps: [
            <>
              That adds it for the current project. To use it in every project,
              add <code>--scope user</code>:
            </>
          ]
        },
        { code: p.claudeCodeUserCommand, lang: "bash" },
        {
          steps: [
            <>
              Start <code>claude</code> and run <code>/mcp</code>. ntumods
              should be listed as connected.
            </>,
            "Ask a question, for example “Which modules list SC1004 as a prerequisite?”."
          ]
        }
      ]
    },
    {
      id: "chatgpt-codex",
      label: "ChatGPT & Codex",
      blocks: [
        { heading: "ChatGPT" },
        {
          note: "ChatGPT on the web adds a server by URL through Developer mode, which OpenAI limits to some plans."
        },
        {
          steps: [
            "Open ChatGPT settings and find the Apps section.",
            "Turn on Developer mode under the advanced settings.",
            "Create a new app.",
            <>
              Enter <code>NTUMods</code> as the name and <code>{p.mcpUrl}</code>{" "}
              as the server URL.
            </>,
            "Choose No authentication, then create the app.",
            "In a new chat, turn NTUMods on from the plus menu, under More, then Developer mode, and ask a question."
          ]
        },
        {
          note: "OpenAI renames these menus often and its own docs no longer describe this path, so look for the words above if the layout differs. If you cannot find Developer mode, use the Codex steps below, or wait for the official ChatGPT listing."
        },
        { heading: "Codex" },
        { steps: ["Run this command in your terminal."] },
        { code: p.codexCommand, lang: "bash" },
        {
          steps: [
            <>
              Or add it to <code>~/.codex/config.toml</code> (or{" "}
              <code>.codex/config.toml</code> in a trusted project):
            </>
          ]
        },
        { code: p.codexToml, lang: "toml", title: "config.toml" },
        {
          note: "Prefer a window? In the Codex desktop app, open Settings, then MCP servers, then Add server. In the IDE extension, use the gear menu, then MCP servers, then Add server. Enter NTUMods as the name, choose Streamable HTTP, enter the URL above, leave sign-in empty, save, then restart."
        },
        {
          steps: [
            <>
              Run <code>codex mcp list</code>, or start <code>codex</code> and
              type <code>/mcp</code>, to check that ntumods is active.
            </>,
            "Ask a question, for example “When is the SC1004 exam?”."
          ]
        }
      ]
    },
    {
      id: "cursor",
      label: "Cursor",
      blocks: [
        {
          steps: [
            <>
              Open <code>~/.cursor/mcp.json</code> for every project, or{" "}
              <code>.cursor/mcp.json</code> for one project. Create the file if
              it does not exist.
            </>,
            "Add the server and save."
          ]
        },
        { code: p.cursorConfig, lang: "json", title: "mcp.json" },
        {
          steps: [
            "Open Customize in the sidebar (Settings, then Tools & MCP, in versions without it) and check that ntumods is turned on.",
            "In an Agent chat, ask a question, for example “What indexes does SC1004 have?”."
          ]
        }
      ]
    },
    {
      id: "vscode",
      label: "VS Code",
      blocks: [
        {
          steps: [
            "Open the Command Palette (Ctrl+Shift+P, or Cmd+Shift+P on Mac) and run MCP: Add Server.",
            "Choose HTTP.",
            <>
              Enter <code>{p.mcpUrl}</code> as the URL.
            </>,
            <>
              Enter <code>ntumods</code> as the server ID.
            </>,
            "Choose Global to use it everywhere, or Workspace for this project only."
          ]
        },
        {
          note: (
            <>
              Prefer a file? Put this in <code>.vscode/mcp.json</code>:
            </>
          )
        },
        { code: p.vscodeConfig, lang: "json", title: "mcp.json" },
        {
          steps: [
            "Open the Chat view in Agent mode, click Configure Tools and make sure ntumods is checked.",
            "Ask a question, for example “Is there an exam for SC1004?”."
          ]
        }
      ]
    },
    {
      id: "others",
      label: "Other tools",
      blocks: [
        {
          steps: [
            "Find where your client adds a remote or custom MCP server.",
            <>
              Use <code>{p.mcpUrl}</code> as the server URL.
            </>,
            "Choose Streamable HTTP as the transport. If it only offers SSE or stdio, see the last step.",
            "Choose no authentication. The server needs no sign-in and no key.",
            "Save it, then ask a question to confirm that the tools show up."
          ]
        },
        {
          note: "Clients that read a JSON file usually accept this shape. Some use servers instead of mcpServers."
        },
        { code: p.cursorConfig, lang: "json" },
        {
          note: "If your client only runs local stdio servers, bridge to the remote one with mcp-remote:"
        },
        { code: p.mcpRemoteCommand, lang: "bash" }
      ]
    }
  ]

  const client = clients.find((c) => c.id === id)
  return client ? <Blocks blocks={client.blocks} /> : null
}

export default McpClientSteps
