import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const IS_DEV = process.env.NODE_ENV === "development"

export const IS_PROD = process.env.NODE_ENV === "production"

export const BASE_URL = IS_DEV ? "http://localhost:3000" : "https://ntumods.com"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function areObjectsEqual(
  obj1: Record<string, any>,
  obj2: Record<string, any>
): boolean {
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        // Sanity Check
        // @See /mods/CE1103 without this condition
        return false
      }
    }
  }

  return true
}
