export const CUSTOM_BLOCK_STYLE = {
  background:
    "bg-[hsl(var(--index-cus-bg))] hover:bg-[hsl(var(--index-cus-bg-hover))] dark:bg-[hsl(var(--index-cus-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-cus-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300",
  text: "text-[hsl(var(--index-cus-text))] dark:text-[hsl(var(--index-cus-text-dark))]",
  textAlt:
    "text-[hsl(var(--index-cus-text-alt))] dark:text-[hsl(var(--index-cus-text-alt-dark))]",
  borderLeft: "border-l-[hsl(var(--index-cus-border))]"
} as const

export const isCustomCourseKey = (moduleKey: string) =>
  moduleKey.startsWith("__CC__")
