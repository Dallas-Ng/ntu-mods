import { twMerge, type ClassNameValue } from "tailwind-merge"


export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/**
 * Join class names, then resolve Tailwind conflicts so the last one wins.
 * tailwind-merge already bundles clsx's join (as twJoin) and flattens arrays,
 * so it does both jobs on its own.
 */
export const cn = (...inputs: ClassNameValue[]) => twMerge(...inputs)
