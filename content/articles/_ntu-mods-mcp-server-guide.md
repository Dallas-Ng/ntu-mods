---
title: "Use NTUMods in Claude and ChatGPT With the MCP Server"
description: "NTUMods now runs a public MCP server, so you can ask Claude, ChatGPT, Claude Code or Cursor about NTU modules, class indexes and exams. Here is how to add it, what it can answer and what it cannot see."
date: "2026-10-23"
updated: "2026-10-23"
author: "NTUMods"
category: "General"
thumbnailText: "MCP server"
tags:
  [
    "ntumods mcp",
    "ntu modules ai",
    "claude ntu modules",
    "chatgpt ntu modules",
    "mcp server",
    "ai assistant ntu",
    "ntu exam timetable ai",
    "claude code",
    "cursor"
  ]
---

# Use NTUMods in Claude and ChatGPT With the MCP Server

AI assistants are good at explaining things, but they are often wrong about NTU. They quote last semester's class times, invent module codes or miss an exam. The NTUMods MCP server fixes that by letting your assistant look up the real data instead of guessing.

> **Quick summary:** Add `https://ntumods.com/mcp` to Claude, ChatGPT, Claude Code or Cursor as a custom connector. There is no account and no key. Your assistant can then search modules, read prerequisites, list class indexes and check exam dates. It cannot see your timetable, which stays in your browser.

## What you can ask for

The server answers questions about public NTU course data. The wording does not need to match exactly.

| You want to     | You could ask                                                              | What the assistant looks up                                                             |
| --------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Find modules    | "Which 3 AU CSC modules are offered this semester?"                        | The module list, filtered by school, level, AU and category.                            |
| Check a module  | "What are the prerequisites for SC2001, and which modules does it unlock?" | The full module record, including prerequisites, exclusions and programme restrictions. |
| See class times | "What indexes does SC1003 have, and when are the labs?"                    | Every index of the module with day, time, venue and remarks.                            |
| Check exams     | "When is the SC1003 exam, and what else is on 23 November?"                | The exam timetable for a semester, by module or by date.                                |
| Look back       | "Which semesters was this module offered in?"                              | The semester history in the module record, and class indexes for older semesters.       |

Nothing here changes any data. Every tool only reads.

## Add it to Claude

1. Open Claude on the web or in the desktop app, then go to Customize and Connectors.
2. Choose Add custom connector.
3. Enter `https://ntumods.com/mcp` as the server URL.
4. Choose No sign-in, then add it.

Free plans can add one custom connector. On Team and Enterprise plans an Owner adds the connector for the organisation, and members then find it under Connectors. You can turn it on or off for each chat from the plus menu.

## Add it to ChatGPT

ChatGPT calls these apps. Turn on developer mode in your settings, create a new app, enter `https://ntumods.com/mcp` and choose No authentication.

Which plans can use developer mode is decided by OpenAI, and it has changed more than once. If you do not see the option, check your workspace settings or ask your workspace admin.

## Add it to Claude Code or Cursor

In Claude Code, run this command:

```bash
claude mcp add --transport http ntumods https://ntumods.com/mcp
```

In Cursor, add this to your `mcp.json`:

```json
{
  "mcpServers": {
    "ntumods": { "url": "https://ntumods.com/mcp" }
  }
}
```

## What the server cannot see

The server knows NTU course data and nothing about you. Your timetable, plans, favourites and CGPA stay in your own browser, so a connector in Claude or ChatGPT cannot read or change them. If you want an assistant that works on your own plans, read the [WebMCP guide](/articles/ntu-ai-agents-webmcp-guide), which covers the separate browser tools.

Text in module records, such as descriptions, comes from NTU. Your assistant is told to treat it as data, but as with any tool, glance at what it is doing if an answer looks strange.

## Check anything that matters

The data is NTU's public course data. It can be out of date or wrong, and the assistant can still misread it. Before you bid, register or drop anything, confirm it in STARS. The [timetable planner](/timetable) shows the same data with clash checks, which is a good way to double-check an answer.

## Fair use

The server is free and public, so it is built to stay cheap. Results are capped, and the server asks clients that call it too fast to wait. Many students share the same network, so the limit is high, but please do not run bulk scrapes through it. If you need everything, download the [open data files](/developers/api) once instead.

## For developers

The [developer docs](/developers/mcp) has the full tool list with inputs, the limits and the error codes. The server uses the standard MCP transport, so any client that supports remote servers should work. If one does not, please tell me through the [feedback page](/feedback).

## Final thoughts

The goal is simple: when you ask an assistant about an NTU module, the answer should come from the real data. If the server gets something wrong, or you would like it to answer something it cannot, let me know.
