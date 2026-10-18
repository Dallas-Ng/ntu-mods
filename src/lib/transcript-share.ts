import { track } from "@/lib/analytics"
import type { Mod } from "@/lib/fgo"

/**
 * Opt-in only. Sends module rows (code, term, AU, grade). The parser never
 * reads the student name, matric number or programme, so none can be sent.
 */
export function shareTranscript(tool: "fgo" | "cgpa", mods: Mod[]) {
  track("transcript_shared", {
    tool,
    mods: mods.map(({ code, term, au, grade }) => ({ code, term, au, grade }))
  })
}
