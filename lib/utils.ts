import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://dabao.dallasng.me"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEF_SCROLLBAR =
  "scrollbar-thin scrollbar-track-slate-200 scrollbar-thumb-slate-400 dark:scrollbar-track-slate-900 dark:scrollbar-thumb-slate-800 scrollbar-thumb-rounded-full"

export const DAY_MAPPING = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday"
}

export function detectMobile() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i
  ]

  return toMatch.some((toMatchItem) => {
    return navigator.userAgent.match(toMatchItem)
  })
}

export function getCourseTypeBorder(type: string) {
  if (type.includes("LEC"))
    return {
      borderLeft: "border-l-orange-500",
      text: "text-orange-600",
      background: "bg-orange-200"
    }

  if (type.includes("LAB"))
    return {
      borderLeft: "border-l-emerald-500",
      text: "text-emerald-600",
      background: "bg-emerald-200"
    }

  if (type.includes("SEM"))
    return {
      borderLeft: "border-l-yellow-500",
      text: "text-yellow-600",
      background: "bg-yellow-200"
    }

  if (type.includes("TUT"))
    return {
      borderLeft: "border-l-blue-500",
      text: "text-blue-600",
      background: "bg-blue-200"
    }

  return {
    borderLeft: "border-l-gray-500",
    text: "text-gray-600",
    background: "bg-gray-200"
  }
}
