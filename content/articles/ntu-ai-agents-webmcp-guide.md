---
title: "Plan Your NTU Timetable With an AI Assistant: What Is New in NTUMods"
description: "NTUMods now works with AI assistants that run in your browser. Ask for clash-free indexes, a free day, exam checks or the CGPA you need, and your plan updates for you. Here is what you can ask and what stays under your control."
date: "2026-10-18"
updated: "2026-10-19"
author: "NTUMods"
category: "General"
tags: ["ntumods ai", "ai timetable planner ntu", "ntu timetable ai", "webmcp", "ai assistant ntu modules", "ntu clash free timetable", "ntu cgpa ai", "ai-catalog.json", "llms.txt"]
---

# Plan Your NTU Timetable With an AI Assistant

Planning a semester usually means switching between STARS, a module list, your exam dates and a calculator. NTUMods now lets an AI assistant in your browser do that legwork with you. You describe what you want in plain words, and the assistant searches modules, checks clashes and updates your plan on NTUMods.

> **Quick summary:** If you use a browser assistant that supports WebMCP, you can ask it things like "build me a timetable with Fridays free" while NTUMods is open. It works on your own plans, in your own browser, and it asks you before it does anything hard to undo. This is an early feature, so only some assistants can use it yet. NTUMods works exactly as before without one.

## What you can ask for

These requests now work, with the NTUMods page open in the same browser. The wording does not need to match exactly.

| You want to | You could ask | What the assistant does |
|---|---|---|
| Find modules | "Which Year 2 CSC modules are offered this semester, and which are 3 AU?" | Searches the full module list and reads prerequisites, exclusions and programme restrictions. |
| Fit a module around your plan | "I want to add SC1001. Which of its indexes clash with what I already have?" | Lists every index, marks the ones that fit your plan and names the module each clash is with. |
| Build a plan from preferences | "Add these six modules, keep Fridays free, and no classes before 10am." | Adds the modules, then uses the same generator as the site to find clash-free combinations. It reports the options, and you can ask it to apply a different one. |
| Check your exams | "Do any of my exams fall on the same day or overlap?" | Compares your plan with the exam timetable and flags overlaps early. |
| Protect your own commitments | "Add gym on Monday and Wednesday from 6pm to 7pm and plan around it." | Adds personal blocks that are clash-checked like modules. |
| Work out your grades | "My CGPA is 4.1 with 80 AU done and 60 left. What do I need for Distinction?" | Gives the average grade needed for each honours class and the lowest letter grade that gets you there. This uses the same maths as the [CGPA Planner](/tools/cgpa-planner) and is unofficial, because some programmes set their own bands. |
| Share and export | "Give me a share link for plan 2 and export it to my calendar." | Creates a link your friends can open, and can produce your plan as calendar (.ics) text to save and import into Google Calendar, Apple Calendar or Outlook. Whether it can hand you a file depends on the assistant. |

## What stays in your control

- **Your plans stay in your browser.** The assistant works on the plans saved in your own browser, the same ones you see on the site. NTUMods does not receive them, and nothing is uploaded to make this feature work.
- **Hard-to-undo actions ask first.** Clearing a plan, or replacing a plan with a shared timetable, shows a confirmation that you answer, not the assistant.
- **Everything else is easy to reverse.** Adding, removing and swapping modules works the same as doing it by hand, and you can switch between your five plans as usual.
- **It is optional.** If your browser or assistant does not support it, nothing changes and nothing extra is loaded.

## What it does not do

NTUMods still does not register you for modules. STARS does that. The data also has no live index vacancies and no exam venues, so an assistant cannot know either. Treat any plan an assistant builds as a draft, and check it against STARS before registration opens. Assistants can also misread a request, so look at the plan on screen before you rely on it.

## How to try it

1. Use a recent version of Chrome and turn on WebMCP. It is an early preview, so the way to enable it can change; [Chrome's WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api) has the current steps.
2. Open [the timetable planner](/timetable) and start an assistant that supports WebMCP tools.
3. Ask for something specific, such as the examples above.

Few assistants use WebMCP today, and this will grow over time. The [timetable planner guide](/articles/ntu-timetable-planner-guide) explains the features the assistant is using, which is also a good way to check its work.

## What is WebMCP?

WebMCP is a new web standard that lets a website tell a browser assistant what it can do. Today, an assistant that wants to use a site has to look at the page and guess which buttons to press, which is slow and often wrong. With WebMCP, the site offers a list of actions with clear descriptions, such as "search modules" or "add a module to the plan". The assistant picks the right action and the site carries it out.

The standard is being drafted by a W3C community group, with Google and Microsoft involved, and Chrome has an early preview. NTUMods offers about 30 of these actions. They are the same things you can already do on the site, so an assistant can never do more than you could do yourself.

## Why NTUMods is taking this step

More students now ask an AI assistant for help with planning, and the assistants are getting better at doing tasks rather than only answering questions. I would rather NTUMods work well with that than be misread by it. When an assistant guesses at a web page, it can pick the wrong index, miss a clash or quote last semester's data. When it uses actions the site provides, it uses the same data and the same clash checks you see on screen.

Alongside this, NTUMods now publishes plain files for assistants that do not run in your browser. [llms.txt](/llms.txt) summarises the site, and [ai-catalog.json](/.well-known/ai-catalog.json) lists what is available, including the open module, index and exam data. If you build tools for NTU students, those are the places to start. Everything in them describes data that is already public on the site.

## Final thoughts

The goal is not to replace planning with an assistant. It is to remove the tedious parts, such as checking every index against your plan, so you spend your time on the choices that matter. If something behaves oddly, please tell me through the [feedback page](/feedback).
