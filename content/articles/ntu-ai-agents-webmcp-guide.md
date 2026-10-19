---
title: "[Dev Preview] Plan Your NTU Timetable With an AI Assistant"
description: "Early developer preview: NTUMods now offers its tools to browser AI assistants through WebMCP. Here is what you will be able to ask, what stays under your control, and how testers can try it today."
date: "2026-10-18"
updated: "2026-10-19"
author: "NTUMods"
category: "General"
tags: ["ntumods ai", "ai timetable planner ntu", "ntu timetable ai", "webmcp", "ai assistant ntu modules", "ntu clash free timetable", "ntu cgpa ai", "ai-catalog.json", "llms.txt"]
---

# [Dev Preview] Plan Your NTU Timetable With an AI Assistant

> **Dev preview:** This feature is at an early stage and depends mostly on the Chrome team. WebMCP is a new browser standard that is still being drafted, and browsers and assistants are only starting to support it. Today it is for testers and developers. Most students will not see any change yet, and NTUMods works exactly as before.

Planning a semester usually means switching between STARS, a module list, your exam dates and a calculator. NTUMods now offers its tools to AI assistants in your browser, so that once your assistant supports it, it can do that legwork with you. You describe what you want in plain words, and the assistant searches modules, checks clashes and updates your plan on NTUMods.

> **Quick summary:** With a browser assistant that supports WebMCP, you can ask things like "build me a timetable with Fridays free" while NTUMods is open. It works on your own plans, in your own browser, and it asks you before it does anything hard to undo. Support is limited today, so see "How to try it" below if you want to test it now.

## What you can ask for

These requests work in a test setup, with the NTUMods page open in the same browser. The wording does not need to match exactly.

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

WebMCP is an early preview, so setup takes a few minutes and is aimed at people comfortable installing a browser extension. If you would rather wait, nothing is lost: it will get easier as browsers and assistants catch up.

1. **Use a recent Chrome.** Chrome's origin trial starts from Chrome 149, and the steps below work for local testing.
2. **Turn WebMCP on.** Open **chrome://flags/#enable-webmcp-testing** in the address bar, set the flag to **Enabled**, then relaunch Chrome.
3. **Add an assistant that can use website tools.** Chrome does not include one that is documented to call WebMCP tools yet, so testers use an extension. Chrome's documentation lists two:
   - The [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) from the Chrome Web Store. It shows the tools a page offers and lets you try them with prompts. It needs a Gemini API key.
   - The [Example Agentic Chrome Extension](https://github.com/GoogleChromeLabs/webmcp-extension/) on GitHub. It needs a small local server and your own API key, so it suits developers more than most students.
4. **Open NTUMods and check the tools appear.** Go to [the timetable planner](/timetable) and open the extension. You should see about 30 NTUMods tools listed. If you see none, check that the flag is enabled and that you relaunched Chrome.
5. **Ask for something specific**, such as the examples above, and check the result on the page.

New to this? Run the [comparison demo](https://googlechromelabs.github.io/webmcp-tools/demos/explainer/#compare) with the same extension first. It is a small page with two tools, so it is an easy way to confirm your setup works before you try NTUMods.

A few things to know before you start. An API key is tied to your own account and usage, so only paste it into an extension you trust, and keep an eye on any usage limits. Gemini in Chrome is a separate feature, and Chrome's documentation does not say it can call WebMCP tools. You can also read the full list of NTUMods tools, with no setup, in [webmcp.json](/.well-known/webmcp.json).

### What to read

- [WebMCP comparison demo](https://googlechromelabs.github.io/webmcp-tools/demos/explainer/#compare): a two-minute look at why this approach is more reliable than an assistant guessing at a page.
- [WebMCP on Chrome for Developers](https://developer.chrome.com/docs/ai/webmcp): the overview, with setup and testing tools. Start here.
- [Imperative API guide](https://developer.chrome.com/docs/ai/webmcp/imperative-api): how a site registers tools, which is the approach NTUMods uses.
- [WebMCP on GitHub](https://github.com/webmachinelearning/webmcp) and the [specification](https://webmachinelearning.github.io/webmcp/): the standard itself, where you can also follow progress and report issues.

The [timetable planner guide](/articles/ntu-timetable-planner-guide) explains the features the assistant is using, which is also a good way to check its work.

## What is WebMCP?

WebMCP is a new web standard that lets a website tell a browser assistant what it can do. Today, an assistant that wants to use a site has to look at the page and guess which buttons to press, which is slow and often wrong. With WebMCP, the site offers a list of actions with clear descriptions, such as "search modules" or "add a module to the plan". The assistant picks the right action and the site carries it out.

To see the difference side by side, try Google's [WebMCP comparison demo](https://googlechromelabs.github.io/webmcp-tools/demos/explainer/#compare). It has an assistant book the same appointment twice, once by guessing at the page and once by calling the actions the page offers.

The standard is being drafted by a W3C community group, with Google and Microsoft involved, and Chrome has an early preview. NTUMods offers about 30 of these actions. They are the same things you can already do on the site, so an assistant can never do more than you could do yourself.

## Why NTUMods is taking this step

More students now ask an AI assistant for help with planning, and the assistants are getting better at doing tasks rather than only answering questions. I would rather NTUMods work well with that than be misread by it. When an assistant guesses at a web page, it can pick the wrong index, miss a clash or quote last semester's data. When it uses actions the site provides, it uses the same data and the same clash checks you see on screen.

Alongside this, NTUMods now publishes plain files for assistants that do not run in your browser. [llms.txt](/llms.txt) summarises the site, and [ai-catalog.json](/.well-known/ai-catalog.json) lists what is available, including the open module, index and exam data. If you build tools for NTU students, those are the places to start. Everything in them describes data that is already public on the site.

## Final thoughts

The goal is not to replace planning with an assistant. It is to remove the tedious parts, such as checking every index against your plan, so you spend your time on the choices that matter. If something behaves oddly, please tell me through the [feedback page](/feedback).
