export const CUSTOM_BLOCK_STYLE = {
  background:
    "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 transition-colors duration-300",
  text: "text-slate-700 dark:text-slate-200",
  textAlt: "text-slate-500 dark:text-slate-400",
  borderLeft: "border-l-slate-400"
} as const

export const isCustomCourseKey = (moduleKey: string) =>
  moduleKey.startsWith("__CC__")
