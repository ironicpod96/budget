"use client"

import { useState, useMemo } from "react"
import { useBudgetStore } from "@/hooks/use-budget-store"
import { Donut } from "@/components/budget/donut"
import { EnvelopeBar } from "@/components/budget/envelope-bar"
import { NumpadModal } from "@/components/budget/numpad-modal"
import { TransactionRow } from "@/components/budget/transaction-row"
import {
  CATEGORIES, CategoryId, COLORS,
  formatRM, getToday, getTodayLabel, getCurrentMonthPrefix,
} from "@/lib/config"

export default function Home() {
  const store = useBudgetStore()
  const [numpadOpen, setNumpadOpen] = useState(false)
  const [tab, setTab] = useState<"day" | "week">("day")

  const today = getToday()
  const monthPrefix = getCurrentMonthPrefix()

  // Monthly envelope budgets
  const totalEnvelopeBudget = store.config.envelopes.reduce((s, e) => s + e.budget, 0)

  // Current month expenses
  const monthExpenses = useMemo(
    () => store.expenses.filter((e) => e.date.startsWith(monthPrefix)),
    [store.expenses, monthPrefix]
  )

  // Today expenses
  const todayExpenses = useMemo(
    () => store.expenses.filter((e) => e.date === today),
    [store.expenses, today]
  )

  const todaySpent = todayExpenses.reduce((s, e) => s + e.amount, 0)

  // Envelope spending for month
  const envelopeSpending = useMemo(() => {
    const map: Record<string, number> = {}
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount
    })
    return map
  }, [monthExpenses])

  // Daily budget = total envelope budget / days in month
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dailyBudget = daysInMonth > 0 ? totalEnvelopeBudget / daysInMonth : 0

  // Weekly chart data
  const weekData = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const spent = store.expenses.filter((e) => e.date === ds).reduce((s, e) => s + e.amount, 0)
      return {
        date: ds,
        spent,
        label: d.toLocaleDateString("en-MY", { weekday: "short" }),
        isToday: ds === today,
      }
    })
  }, [store.expenses, today])

  const maxWeekSpent = Math.max(...weekData.map((d) => d.spent), dailyBudget, 1)

  const handleAddExpense = (amount: number, category: CategoryId, desc: string) => {
    store.addExpense({ date: today, amount, category, desc, source: "manual" })
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-lg mx-auto px-5 pt-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[34px] font-bold text-white tracking-tight">
            Spent today
          </h1>
          {/* Settings icon */}
          <button className="w-8 h-8 flex items-center justify-center text-white/60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="8" cy="6" r="2" fill="currentColor" /><circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="10" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* Main card */}
        <div
          className="rounded-[32px] px-8 py-6 mb-8"
          style={{ backgroundColor: COLORS.card }}
        >
          {/* Date */}
          <p className="text-[22px] font-bold text-white tracking-tight mb-4">
            {getTodayLabel()}
          </p>

          {/* Donut */}
          <div className="flex justify-center mb-6">
            <Donut spent={todaySpent} budget={dailyBudget} />
          </div>

          {/* Envelope bars */}
          <div className="flex flex-col gap-[6px]">
            {store.config.envelopes.filter(e => e.budget > 0).map((envelope) => {
              const spent = envelopeSpending[envelope.id] || 0
              return (
                <EnvelopeBar
                  key={envelope.id}
                  label={envelope.label}
                  spent={spent}
                  budget={envelope.budget}
                  color={envelope.color}
                />
              )
            })}
            {totalEnvelopeBudget === 0 && (
              <p className="text-sm text-white/30 text-center py-4">
                Set up your envelopes in settings
              </p>
            )}
          </div>
        </div>

        {/* Transactions header with tabs */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-bold text-white tracking-tight">
            Transactions
          </h2>
          <div
            className="flex rounded-[12px] p-1"
            style={{ backgroundColor: COLORS.card }}
          >
            <button
              onClick={() => setTab("day")}
              className="px-3 py-1.5 rounded-[8px] text-[14px] font-medium transition-colors"
              style={{
                backgroundColor: tab === "day" ? COLORS.bg : "transparent",
                color: tab === "day" ? "white" : "rgba(255,255,255,0.5)",
              }}
            >
              Day
            </button>
            <button
              onClick={() => setTab("week")}
              className="px-3 py-1.5 rounded-[8px] text-[14px] font-medium transition-colors"
              style={{
                backgroundColor: tab === "week" ? COLORS.bg : "transparent",
                color: tab === "week" ? "white" : "rgba(255,255,255,0.5)",
              }}
            >
              Week
            </button>
          </div>
        </div>

        {/* Tab content */}
        {tab === "day" && (
          <div className="flex flex-col gap-2">
            {todayExpenses.length === 0 ? (
              <p className="text-white/30 text-center py-12 text-base">
                Nothing logged yet today
              </p>
            ) : (
              todayExpenses.map((e) => (
                <TransactionRow
                  key={e.id}
                  category={e.category}
                  desc={e.desc}
                  amount={e.amount}
                  onDelete={() => store.deleteExpense(e.id)}
                />
              ))
            )}
          </div>
        )}

        {tab === "week" && (
          <div className="px-2">
            <div className="flex gap-2 items-end h-40 mb-4">
              {weekData.map((d) => {
                const h = (d.spent / maxWeekSpent) * 100
                const over = d.spent > dailyBudget
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-mono text-white/40">
                      {d.spent > 0 ? Math.round(d.spent) : ""}
                    </span>
                    <div
                      className="w-full rounded-lg transition-all"
                      style={{
                        height: `${Math.max(h, 3)}%`,
                        minHeight: 4,
                        backgroundColor: over ? COLORS.red : d.isToday ? COLORS.green : COLORS.track,
                      }}
                    />
                    <span
                      className="text-[13px]"
                      style={{
                        color: d.isToday ? "white" : "rgba(255,255,255,0.4)",
                        fontWeight: d.isToday ? 600 : 400,
                      }}
                    >
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Daily budget line label */}
            <div className="flex items-center gap-2 justify-center mb-6">
              <div className="w-3 h-[2px] rounded-full" style={{ backgroundColor: COLORS.green }} />
              <span className="text-[11px] text-white/40">Daily budget: {formatRM(dailyBudget)}</span>
            </div>

            {/* Monthly category totals */}
            <div className="flex flex-col gap-2">
              {store.config.envelopes.filter(e => e.budget > 0).map((envelope) => {
                const spent = envelopeSpending[envelope.id] || 0
                return (
                  <div
                    key={envelope.id}
                    className="flex items-center justify-between px-5 py-3 rounded-[16px]"
                    style={{ backgroundColor: COLORS.card }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{envelope.emoji}</span>
                      <span className="text-[15px] text-white/60">{envelope.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-mono text-white/80">{formatRM(spent)}</span>
                      <span className="text-[12px] text-white/30">/ {formatRM(envelope.budget)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* FAB - Add expense */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-40">
        <button
          onClick={() => setNumpadOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          style={{ backgroundColor: COLORS.green }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
      </div>

      {/* Numpad modal */}
      <NumpadModal
        open={numpadOpen}
        onClose={() => setNumpadOpen(false)}
        onSubmit={handleAddExpense}
      />
    </div>
  )
}
