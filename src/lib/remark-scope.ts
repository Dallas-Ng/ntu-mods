export type RemarkScope = "index" | "module" | null

/**
 * An index-specific note (e.g. "seat near the door" for one tutorial
 * group) always takes precedence over a module-wide one for display
 * purposes when both happen to be set for the same index.
 */
export const getRemarkScope = (
  moduleRemark: string | undefined,
  indexRemark: string | undefined
): RemarkScope => {
  if (indexRemark) return "index"
  if (moduleRemark) return "module"
  return null
}

/** Shared dot colour so a note's scope reads the same in the sidebar row
 * and on the timetable block itself. */
export const REMARK_SCOPE_DOT_CLASS: Record<
  Exclude<RemarkScope, null>,
  string
> = {
  index: "bg-primary",
  module: "bg-amber-500"
}
