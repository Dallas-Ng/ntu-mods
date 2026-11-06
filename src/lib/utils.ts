import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}
