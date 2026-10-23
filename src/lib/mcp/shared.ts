// Pure helpers shared by the browser WebMCP handlers and the worker's /mcp
// handlers, so both describe slots and read dates the same way.

export const DAYS = [
  "Online/TBA",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun"
]

export const describeSlot = (slot: Index) => ({
  type: slot.isCustom ? slot.remarks : slot.type,
  group: slot.group,
  day: DAYS[slot.day] ?? "Online/TBA",
  time: slot.day ? slot.time : "no fixed time",
  venue: slot.venue,
  remarks: slot.isCustom ? "" : slot.remarks
})

/** "2026-11-23" or "23 Nov 2026" -> "23 november 2026", the casing list_exams compares in. */
export function normaliseDate(value: string): string {
  const v = value.trim()
  if (!v) return ""
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (iso) {
    const month = new Date(
      Date.UTC(2000, Number(iso[2]) - 1, 1)
    ).toLocaleString("en-GB", {
      month: "long",
      timeZone: "UTC"
    })
    return `${Number(iso[3])} ${month} ${iso[1]}`.toLowerCase()
  }
  return v.toLowerCase()
}
