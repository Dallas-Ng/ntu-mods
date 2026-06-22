export const CUSTOM_COURSE_COLORS: Record<
  CustomCourseColor,
  {
    background: string
    text: string
    textAlt: string
    swatch: string
    label: string
  }
> = {
  violet: {
    background:
      "bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/50 dark:hover:bg-violet-800/60 transition-colors duration-300",
    text: "text-violet-800 dark:text-violet-200",
    textAlt: "text-violet-600 dark:text-violet-300",
    swatch: "bg-violet-400",
    label: "Violet"
  },
  blue: {
    background:
      "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-800/60 transition-colors duration-300",
    text: "text-blue-800 dark:text-blue-200",
    textAlt: "text-blue-600 dark:text-blue-300",
    swatch: "bg-blue-400",
    label: "Blue"
  },
  emerald: {
    background:
      "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-800/60 transition-colors duration-300",
    text: "text-emerald-800 dark:text-emerald-200",
    textAlt: "text-emerald-600 dark:text-emerald-300",
    swatch: "bg-emerald-400",
    label: "Green"
  },
  rose: {
    background:
      "bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:hover:bg-rose-800/60 transition-colors duration-300",
    text: "text-rose-800 dark:text-rose-200",
    textAlt: "text-rose-600 dark:text-rose-300",
    swatch: "bg-rose-400",
    label: "Rose"
  },
  orange: {
    background:
      "bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/50 dark:hover:bg-orange-800/60 transition-colors duration-300",
    text: "text-orange-800 dark:text-orange-200",
    textAlt: "text-orange-600 dark:text-orange-300",
    swatch: "bg-orange-400",
    label: "Orange"
  },
  amber: {
    background:
      "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800/60 transition-colors duration-300",
    text: "text-amber-800 dark:text-amber-200",
    textAlt: "text-amber-600 dark:text-amber-300",
    swatch: "bg-amber-400",
    label: "Amber"
  }
}

export const DEFAULT_CUSTOM_COURSE_COLOR: CustomCourseColor = "violet"

export const isCustomCourseKey = (moduleKey: string) =>
  moduleKey.startsWith("__CC__")
