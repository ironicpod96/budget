import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRM(n: number) {
  return `RM${Math.abs(n).toFixed(2)}`
}

export function formatDate(d: string) {
  const date = new Date(d + "T00:00:00")
  return date.toLocaleDateString("en-MY", { day: "numeric", month: "short" })
}

export function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}
