// === TYPES ===
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

export interface Envelope {
  id: CategoryId
  label: string
  emoji: string
  budget: number // monthly allocation
  color: string
}

export interface BillItem {
  id: string
  name: string
  amount: number
  dueDay: number // day of month
  paid: boolean
}

export interface SalaryConfig {
  gross: number
  bonus: number
  epfRate: number // default 0.11
  employerEpfRate: number // default 0.13 or 0.12
}

export interface UserConfig {
  salary: SalaryConfig
  bills: BillItem[]
  envelopes: Envelope[]
  onboarded: boolean
}

// === CATEGORIES ===
export const CATEGORY_IDS = ["food", "groceries", "transport", "personal", "health", "shopping", "fun"] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

export const CATEGORIES: Record<CategoryId, { label: string; emoji: string; color: string }> = {
  food: { label: "Food", emoji: "🍜", color: "#4ADE80" },
  groceries: { label: "Groceries", emoji: "🛒", color: "#34D399" },
  transport: { label: "Transport", emoji: "🚗", color: "#60A5FA" },
  personal: { label: "Personal", emoji: "💆", color: "#F472B6" },
  health: { label: "Health", emoji: "💊", color: "#38BDF8" },
  shopping: { label: "Shopping", emoji: "🛍️", color: "#C084FC" },
  fun: { label: "Fun Money", emoji: "🎉", color: "#FBBF24" },
}

// === DESIGN TOKENS ===
export const COLORS = {
  bg: "#0a0908",
  card: "#1f1b19",
  cardBorder: "#2a2523",
  track: "#383331",
  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.6)",
  textMuted: "rgba(255,255,255,0.35)",
  green: "#4ADE80",
  amber: "#FBBF24",
  red: "#D11F22",
  ring: "#2D2B29",
}

// === SALARY CALCULATOR (Malaysia 2026) ===
export function calculateNetSalary(gross: number, bonus: number = 0, epfRate = 0.11) {
  const employerEpfRate = gross <= 5000 ? 0.13 : 0.12

  // EPF
  const employeeEPF = Math.ceil(gross * epfRate)
  const employerEPF = Math.ceil(gross * employerEpfRate)

  // SOCSO (capped at RM6,000)
  const socsoBase = Math.min(gross, 6000)
  const employeeSOCSO = Math.round(socsoBase * 0.005 * 100) / 100
  const employerSOCSO = Math.round(socsoBase * 0.0175 * 100) / 100

  // EIS (capped at RM6,000)
  const eisBase = Math.min(gross, 6000)
  const employeeEIS = Math.round(eisBase * 0.002 * 100) / 100
  const employerEIS = Math.round(eisBase * 0.002 * 100) / 100

  // PCB (monthly tax estimate)
  const annualGross = (gross + bonus) * 12
  const annualAfterEPF = annualGross - employeeEPF * 12
  const chargeableIncome = Math.max(0, annualAfterEPF - 9000) // individual relief

  const annualTax = calculateProgressiveTax(chargeableIncome)
  const taxAfterRebate = chargeableIncome <= 35000 ? Math.max(0, annualTax - 400) : annualTax
  const monthlyPCB = Math.round((taxAfterRebate / 12) * 100) / 100

  const totalDeductions = employeeEPF + employeeSOCSO + employeeEIS + monthlyPCB
  const netSalary = Math.round((gross - totalDeductions) * 100) / 100

  return {
    gross,
    netSalary,
    employeeEPF,
    employerEPF,
    employeeSOCSO,
    employerSOCSO,
    employeeEIS,
    employerEIS,
    monthlyPCB,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    employerContribution: Math.round((employerEPF + employerSOCSO + employerEIS) * 100) / 100,
  }
}

function calculateProgressiveTax(chargeable: number): number {
  const brackets = [
    { limit: 5000, rate: 0 },
    { limit: 20000, rate: 0.01 },
    { limit: 35000, rate: 0.03 },
    { limit: 50000, rate: 0.06 },
    { limit: 70000, rate: 0.11 },
    { limit: 100000, rate: 0.19 },
    { limit: 250000, rate: 0.25 },
    { limit: 400000, rate: 0.26 },
    { limit: 2000000, rate: 0.28 },
    { limit: Infinity, rate: 0.30 },
  ]

  let tax = 0
  let prev = 0

  for (const bracket of brackets) {
    if (chargeable <= prev) break
    const taxable = Math.min(chargeable, bracket.limit) - prev
    tax += taxable * bracket.rate
    prev = bracket.limit
  }

  return Math.round(tax * 100) / 100
}

// === HELPERS ===
export function formatRM(n: number) {
  return `RM${Math.abs(n).toFixed(0)}`
}

export function formatRMDecimal(n: number) {
  return `RM${Math.abs(n).toFixed(2)}`
}

export function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function getTodayLabel() {
  return new Date().toLocaleDateString("en-MY", { month: "short", day: "numeric", weekday: "short" })
}

export function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function getDaysLeftInMonth() {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate() + 1
}

export function getCurrentMonthPrefix() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
