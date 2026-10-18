---
title: "Use an AI Agent With NTUMods: WebMCP Tools and the AI Catalog Explained"
description: "NTUMods now exposes its module search, timetable, exam and CGPA features to AI agents through WebMCP, and publishes an AI catalog. Here is what that means and how to try it."
date: "2026-10-18"
author: "NTUMods"
category: "General"
tags: ["ntumods ai", "webmcp", "ai agent ntu timetable", "ntu timetable ai", "ai-catalog.json", "llms.txt", "ntu module search ai"]
---

# Use an AI Agent With NTUMods

An AI assistant that can read a web page can already tell you a little about NTU. An assistant that can use the page can do much more: search modules, check whether an index clashes with your plan, and build a timetable for you. NTUMods now supports the second kind, using a new browser standard called WebMCP.

> **Quick summary:** In a browser and assistant that support WebMCP, NTUMods offers about thirty tools to the assistant while you have the site open. They work on your own saved plans, in your own browser. Nothing is sent to an NTUMods server to make this work. Two public files, `llms.txt` and `ai-catalog.json`, describe the site for assistants that do not run inside your browser.

## What WebMCP is

WebMCP lets a web page tell an in-browser assistant what it can do. Instead of guessing which button to click, the assistant calls a named tool with typed inputs, such as "search modules with the query data structures". The page runs the tool and returns the result.

WebMCP is an early preview. At the time of writing it needs a recent version of Chrome with an experimental flag turned on, and only some assistants call these tools. If your browser does not support it, NTUMods behaves exactly as before and nothing extra is loaded.

## What the tools can do

| Area | Examples |
|---|---|
| Find modules | Search by code, title, school, level or AU. Read a full module record with prerequisites. |
| Classes and exams | List the indexes of a module with their timeslots. Look up an exam date and time. |
| Your timetable | Add or remove modules, change an index, switch between your five plans, and add personal time blocks. |
| Planning | Ask which indexes of a module fit around your current plan, or generate clash-free combinations from your preferences. |
| Sharing | Get a share link, load a shared timetable, or export your plan as a calendar file. |
| Grades | Work out the average grade you need for each honours class, or project your CGPA. |

The tools can only do what you could do yourself on the site. Anything destructive, such as clearing a plan or replacing it with a shared one, asks you to confirm first.

## Try it

1. Open `chrome://flags/#enable-webmcp-testing` in a recent Chrome and enable it, then restart.
2. Open [the timetable planner](/timetable) and start an assistant that supports WebMCP tools.
3. Ask something concrete: "Add SC1003 and MH1810 to my plan, pick indexes that do not clash, and tell me which days I am free."

Your plans stay in your browser. The [timetable planner guide](/articles/ntu-timetable-planner-guide) explains the features the tools use.

## For assistants outside the browser

Two public files help assistants that cannot run the site.

- [llms.txt](/llms.txt) summarises the site and lists its pages.
- [ai-catalog.json](/.well-known/ai-catalog.json) follows the AI Catalog format. It points to the llms.txt file, the module API, the open data files for modules, indexes and exams, and a [list of the WebMCP tools](/.well-known/webmcp.json) with their input schemas.

## What it does not do

NTUMods still does not register you for modules. STARS does that. The data has no live index vacancies and no exam venues, so an assistant using these tools cannot know them either. Treat any plan an assistant builds as a draft and check it against STARS before registration opens.

## Final thoughts

I built this because planning a semester is exactly the kind of task people already ask assistants to help with, and a tool call is far more reliable than an assistant guessing at a web page. If something behaves oddly, please tell me through the [feedback page](/feedback).
