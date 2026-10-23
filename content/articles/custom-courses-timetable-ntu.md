---
title: "How to Add Custom Courses to Your NTU Timetable"
description: "Use NTUMods custom courses to block out personal time — gym, lunch, CCA, or off-campus commitments — and instantly see clashes with your registered modules."
date: "2026-06-22"
author: "NTUMods"
category: "Timetable Planning"
thumbnailText: "Custom blocks"
tags: ["NTU timetable", "NTUMods", "timetable planning", "custom course", "ntu planner", "block time", "ntu schedule", "personal schedule ntu"]
---

# How to Add Custom Courses to Your NTU Timetable

When you plan a semester, registered modules are only part of the picture. Gym sessions, CCA meetings, part-time work shifts, and long lunches all take real time — and if they do not appear on your timetable grid, it is easy to accidentally schedule a tutorial right over them.

NTUMods now lets you add **custom courses**: named time blocks that sit on the timetable grid alongside your registered modules. They show up visually, flag clashes, and persist per plan so each of your five timetable plans can have a different set.

## What custom courses are for

Custom courses are useful any time you have a recurring commitment that is not in the NTU module database:

- **CCA and sports** — weekly training, rehearsals, or committee meetings
- **Gym or fitness** — time you want to protect before it gets crowded out
- **Lunch windows** — marking off the time you actually need to eat and travel
- **Part-time work** — shifts that recur on specific days
- **Off-campus courses** — language classes, external certifications, or enrichment programmes
- **Buffer time** — commute windows or recharge blocks between heavy classes

Anything you would pencil into a physical planner can go here.

## How to add a custom course

1. Open the [Timetable](https://ntumods.com/timetable) page.
2. In the right sidebar (or via the mobile modifier button), scroll to **Custom Blocks**.
3. Click **Add custom block**.
4. Fill in the details:
   - **Name** — what this block is (e.g. "Gym", "Badminton CCA", "Lunch")
   - **Session type** — a preset (Lecture, Tutorial, Lab, Seminar, Design, Project) or your own label like "Gym" or "Work"
   - **Day** — Monday through Sunday
   - **Start time** and **End time** — select from the standard 30-minute slots
   - **Venue** — optional, but useful for planning commutes
5. Add more sessions if the commitment recurs on several days.
6. Click **Save**.

![Add custom block dialog in the NTUMods NTU timetable planner with name, session days, venue, start time and end time fields](/articles/ntumods-add-custom-block-dialog.webp "The Add custom block dialog: name it, pick the days, then set the venue and times.")

The block appears on the timetable grid immediately.

![NTU timetable with custom Gym blocks on Monday, Wednesday and Friday shown next to registered modules in NTUMods](/articles/ntumods-timetable-custom-gym-blocks.webp "Custom Gym blocks sit on the grid beside registered modules, so clashes are visible straight away.")

## Options: letting the generator choose the timing

A block can hold more than one **option** — alternative sets of days and times for the same commitment. Gym on Monday morning or Thursday evening; a work shift on Tuesday or Wednesday. Click **+ Option** in the editor to add one; it starts as a copy of the option you were looking at, so you only change what differs.

Options behave exactly like module indexes. When you run **Generate**, the generator tries each option and keeps whichever fits your constraints and scores best — so you do not have to guess which gym slot leaves the most free days. You can also switch options by hand from the sidebar, or by clicking the block on the grid in **Pick indexes** mode.

If a block should stay put during generation, lock it under **Generation Settings → Locked modules**.

## Editing and removing custom courses

Click any custom block in the list to open the editor. Change the name, sessions, times, venue, or options, then click **Save**. To remove a block, click the trash icon on the right of the row.

## Clash detection

Custom courses participate in the same grid layout as registered modules. If a custom block overlaps with a tutorial or lecture, the cells appear side by side in the same column — the same way registered modules clash with each other. There is no separate warning; the visual overlap makes it immediately obvious.

Generate mode treats them as real obstacles: it will not hand you a timetable where a class sits on top of a custom block. Your own blocks are exempt from the day-hours, lunch-break and spacing settings, though — a 7am gym session is a commitment you already made, not something the generator gets to move.

This is useful during planning. You can add a gym block, then try different indexes for a module to find one that does not clash with it — without any manual time arithmetic.

## Custom courses are per-plan

Each of your five timetable plans has its own independent set of custom courses. Switching plans switches the blocks shown on the grid. If you duplicate a plan, the custom courses in that plan are copied to the new one with fresh IDs, so editing one does not affect the other.

## Sharing custom blocks

Custom blocks can travel with a shared timetable. Open the actions menu, choose **Share**, and leave **Include custom blocks** ticked — the blocks are packed into the link, and whoever opens it sees them on the grid. Untick it to share only your registered modules.

Links have a practical length limit, so for many blocks use **Copy as text** instead. That gives you a code starting with `NTUMODS1-` that you can paste anywhere. The receiver pastes it into **Import from text** in the same menu and picks which of their five plans to import into. Import also accepts a pasted share link, so either form works.

Both carriers keep every option of every block, along with which one is currently selected.

## Limitations to keep in mind

Custom courses are stored locally in your browser alongside your timetable. They are not synced to a server or an account.

Calendar (.ics) export covers registered modules only — custom blocks are not included. Screenshots taken via the screenshot button do include custom courses as they appear on screen.

## Example: planning around a gym schedule

Suppose you want three gym sessions per week before your first class. You might add:

- **Monday Gym** — 08:00–09:00, Sports Hall
- **Wednesday Gym** — 08:00–09:00, Sports Hall
- **Friday Gym** — 08:00–09:00, Sports Hall

With those blocks in place, you can switch between module indexes and immediately see whether any option starts at 08:30 — which would clash. You find an index that starts at 09:30, and your gym sessions are safe.

The same approach works for CCA commitments, work shifts, or anything else with a fixed weekly rhythm.

## Related

- [How to Plan NTU Modules Before STARS Opens](/articles/how-to-plan-for-modules)
- [Easy BDEs at NTU](/articles/easy-bde-at-ntu)
- [Complete NTU BDE List](/articles/complete-ntu-bde-list)

## Frequently asked questions

### Do custom courses appear in shared timetable links?

Yes, if you want them to. The share dialog has an **Include custom blocks** checkbox, ticked by default. Untick it and the link carries only your registered modules. For a lot of blocks, use **Copy as text** and have the receiver paste the code into **Import from text**.

### Does the timetable generator avoid my custom blocks?

Yes. Generate mode treats custom blocks as fixed obstacles and will not put a class on top of one. If a block has several options, the generator picks whichever one fits best. Your blocks are exempt from the day-hours, lunch-break and back-to-back settings, so an early or late block never makes generation impossible.

### Do custom courses sync across devices?

No. They are stored locally per browser, not synced to an account or server. If you switch devices or clear browser data, custom courses on that device are lost.

### Can I add more than one custom course on the same day?

Yes. Add as many blocks as you need — recurring commitments like gym, lunch, and CCA can all sit on the same day's grid, and each one is checked for clashes independently.

### Does clash detection treat custom courses the same as registered modules?

Yes. A custom course overlapping a tutorial or lecture displays side by side in the same grid column, exactly like two registered modules clashing with each other.
