import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEF_SCROLLBAR =
  "scrollbar-thin scrollbar-track-slate-200 scrollbar-thumb-slate-400 dark:scrollbar-track-slate-900 dark:scrollbar-thumb-slate-800 scrollbar-thumb-rounded-full"
