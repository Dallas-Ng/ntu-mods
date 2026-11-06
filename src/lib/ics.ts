/**
 * A small RFC 5545 writer for the timetable export. It replaces the `ics`
 * package, which pulled in a VEVENT builder, alarms, recurrence rules and a
 * timezone database we never used.
 *
 * Times are written as floating local time (no `Z`): a class at 08:30 happens
 * at 08:30 on the reader's clock, wherever they open the calendar.
 */

/** CRLF is required between content lines (RFC 5545 §3.1). */
const CRLF = "\r\n"

/** Longest content line, in octets, before folding. */
const MAX_LINE_OCTETS = 75

export interface IcsEvent {
  /** Globally unique id. Calendar apps use it to update an event in place. */
  uid: string
  start: Date
  end: Date
  summary: string
  description?: string
  location?: string
}

const pad = (value: number) => String(value).padStart(2, "0")

/** `20270111T083000`: floating local time, as `DTSTART`/`DTEND` take it. */
export const formatIcsDate = (date: Date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`

/** `20261106T024632Z`: UTC, as `DTSTAMP` requires. */
const formatIcsUtc = (date: Date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds()
  )}Z`

/** RFC 5545 §3.3.11: backslash, semicolon and comma are escaped, newlines become `\n`. */
const escapeText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n")

/**
 * Fold a content line at 75 octets, continuing with a single leading space
 * (RFC 5545 §3.1). Octets, not characters: a multi-byte character must not be
 * split across the fold, so the budget is counted per code point.
 */
const foldLine = (line: string) => {
  // TextEncoder, not Buffer: this also runs in the browser, where the export
  // button builds the file client-side.
  const encoder = new TextEncoder()
  const bytes = (text: string) => encoder.encode(text).length

  if (bytes(line) <= MAX_LINE_OCTETS) return line

  const parts: string[] = []
  let current = ""
  // Continuations start with a space, leaving 74 octets for their content.
  let budget = MAX_LINE_OCTETS

  for (const char of line) {
    const size = bytes(char)
    if (bytes(current) + size > budget) {
      parts.push(current)
      current = ""
      budget = MAX_LINE_OCTETS - 1
    }
    current += char
  }

  if (current) parts.push(current)

  return parts.join(`${CRLF} `)
}

const contentLine = (name: string, value: string) =>
  foldLine(`${name}:${value}`)

/** Serialise events into a complete `text/calendar` document. */
export const createIcs = (
  events: IcsEvent[],
  {
    prodId = "-//NTUMods//Timetable export//EN",
    stamp = new Date()
  }: { prodId?: string; stamp?: Date } = {}
) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    contentLine("PRODID", prodId),
    "METHOD:PUBLISH",
    contentLine("X-WR-CALNAME", "NTUMods timetable")
  ]

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      contentLine("UID", event.uid),
      contentLine("DTSTAMP", formatIcsUtc(stamp)),
      contentLine("DTSTART", formatIcsDate(event.start)),
      contentLine("DTEND", formatIcsDate(event.end)),
      contentLine("SUMMARY", escapeText(event.summary))
    )
    if (event.description)
      lines.push(contentLine("DESCRIPTION", escapeText(event.description)))
    if (event.location)
      lines.push(contentLine("LOCATION", escapeText(event.location)))
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")

  return `${lines.join(CRLF)}${CRLF}`
}
