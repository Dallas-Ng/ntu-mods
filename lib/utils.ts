import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const IS_DEV = process.env.NODE_ENV === "development"

export const IS_PROD = process.env.NODE_ENV === "production"

export const BASE_URL = IS_DEV
  ? "http://localhost:3000"
  : "https://dabao.dallasng.me"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
