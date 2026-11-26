import type { APIRoute } from "astro"

import { getAllAcademicYearCalendars } from "@/lib/academic-calendar"
import { academicCalendarEvents } from "@/lib/academic-calendar-events"
import { createIcs } from "@/lib/ics"

export const prerender = true

/**
 * The NTU academic calendar as a feed to subscribe to by URL: teaching weeks,
 * recess, exam weeks, holidays and key events for every published year. Apps
 * re-fetch it, so a yearly refresh of calendar.json reaches subscribers.
 */
export const GET: APIRoute = () =>
  new Response(
    createIcs(
      getAllAcademicYearCalendars().flatMap((calendar) =>
        academicCalendarEvents(calendar, {
          teachingWeeks: true,
          keyEvents: true
        })
      ),
      {
        prodId: "-//NTUMods//Academic calendar//EN",
        name: "NTU academic calendar",
        refresh: "P1D"
      }
    ),
    { headers: { "Content-Type": "text/calendar; charset=utf-8" } }
  )
