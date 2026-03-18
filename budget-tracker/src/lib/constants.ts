export const CATEGORIES = [
  { id: "food", label: "Food", emoji: "🍜", color: "hsl(10, 78%, 54%)" },
  { id: "transport", label: "Transport", emoji: "🚗", color: "hsl(216, 78%, 57%)" },
  { id: "groceries", label: "Groceries", emoji: "🛒", color: "hsl(145, 55%, 42%)" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", color: "hsl(280, 55%, 55%)" },
  { id: "personal_care", label: "Personal Care", emoji: "💆", color: "hsl(330, 60%, 55%)" },
  { id: "bills", label: "Bills", emoji: "📄", color: "hsl(45, 80%, 50%)" },
  { id: "entertainment", label: "Entertainment", emoji: "🎮", color: "hsl(180, 55%, 45%)" },
  { id: "other", label: "Other", emoji: "📦", color: "hsl(0, 0%, 55%)" },
] as const

export type CategoryId = (typeof CATEGORIES)[number]["id"]

export const BUDGET_CONFIG = {
  startDate: "2026-03-18",
  endDate: "2026-04-25",
  totalSavings: 6000,
  spendingCash: 500,
  fixedBills: [
    { name: "Rent", amount: 1400, due: "Apr 1" },
    { name: "Internet (TIME)", amount: 145, due: "Early Apr" },
    { name: "Utilities", amount: 150, due: "Apr" },
    { name: "Mom", amount: 800, due: "Monthly" },
    { name: "Claude", amount: 88, due: "Mid Apr" },
    { name: "UMobile", amount: 40, due: "Monthly" },
    { name: "iPad", amount: 108, due: "Monthly" },
    { name: "Coway", amount: 99, due: "Auto" },
  ],
}

export function getCategoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}
