import { twMerge, type ClassNameValue } from "tailwind-merge"

/**
 * Join class names, then resolve Tailwind conflicts so the last one wins.
 * tailwind-merge already bundles clsx's join (as twJoin) and flattens arrays,
 * so it does both jobs on its own.
 */
export const cn = (...inputs: ClassNameValue[]) => twMerge(...inputs)
