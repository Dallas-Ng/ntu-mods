import { getIndexTypeStyle } from "./get-index-type-style"

export const PRESET_INDEX_TYPES = new Set([
  "LEC",
  "TUT",
  "LAB",
  "SEM",
  "DES",
  "PRJ"
])

export const CUSTOM_LUNCH_TYPE = "LUNCH"

export const CUSTOM_BLOCK_STYLE = {
  background:
    "bg-[hsl(var(--index-cus-bg))] hover:bg-[hsl(var(--index-cus-bg-hover))] dark:bg-[hsl(var(--index-cus-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-cus-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300",
  text: "text-[hsl(var(--index-cus-text))] dark:text-[hsl(var(--index-cus-text-dark))]",
  textAlt:
    "text-[hsl(var(--index-cus-text-alt))] dark:text-[hsl(var(--index-cus-text-alt-dark))]",
  borderLeft: "border-l-[hsl(var(--index-cus-border))]"
} as const

const LUNCH_STYLE = {
  background:
    "bg-[hsl(var(--index-lunch-bg))] hover:bg-[hsl(var(--index-lunch-bg-hover))] dark:bg-[hsl(var(--index-lunch-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-lunch-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300",
  text: "text-[hsl(var(--index-lunch-text))] dark:text-[hsl(var(--index-lunch-text-dark))]",
  textAlt:
    "text-[hsl(var(--index-lunch-text-alt))] dark:text-[hsl(var(--index-lunch-text-alt-dark))]",
  borderLeft: "border-l-[hsl(var(--index-lunch-border))]"
} as const

// Same resolution rule every custom-block cell uses: preset types (LEC/LAB/…)
// keep the color they'd have as a real module, Lunch gets its own reserved
// color, anything else falls back to the shared custom-block color.
export const getCustomBlockStyle = (type: string) =>
  type === CUSTOM_LUNCH_TYPE
    ? LUNCH_STYLE
    : PRESET_INDEX_TYPES.has(type)
      ? getIndexTypeStyle(type)!
      : CUSTOM_BLOCK_STYLE

export const CUSTOM_COURSE_KEY_PREFIX = "__CC__"

export const isCustomCourseKey = (moduleKey: string) =>
  moduleKey.startsWith(CUSTOM_COURSE_KEY_PREFIX)

export const customCourseModuleKey = (courseId: string) =>
  `${CUSTOM_COURSE_KEY_PREFIX}${courseId}`

export const customCourseIdFromKey = (moduleKey: string) =>
  moduleKey.slice(CUSTOM_COURSE_KEY_PREFIX.length)
