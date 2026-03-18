import { CategoryId } from "@/lib/constants"

export interface Expense {
  id: string
  date: string
  amount: number
  desc: string
  category: CategoryId
  source: "manual" | "scan"
  created_at: string
}

export interface Income {
  id: string
  date: string
  amount: number
  desc: string
  created_at: string
}

export interface BillStatus {
  [key: string]: boolean
}

export interface ScanResult {
  date: string
  amount: number
  desc: string
  category: CategoryId
  confidence: "high" | "medium" | "low"
}
