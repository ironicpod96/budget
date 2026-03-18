"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"
import { ScanModal } from "@/components/scan-modal"
import { useBudgetStore } from "@/hooks/use-budget-store"
import { CATEGORIES, BUDGET_CONFIG, getCategoryById, CategoryId } from "@/lib/constants"
import { formatRM, formatDate, getToday, daysBetween } from "@/lib/utils"
import { ScanResult } from "@/types"
import { Plus, Trash2, FileUp, Check } from "lucide-react"

export default function Home() {
  const store = useBudgetStore()
  const [amount, setAmount] = useState("")
  const [desc, setDesc] = useState("")
  const [category, setCategory] = useState<CategoryId>("food")
  const [scanOpen, setScanOpen] = useState(false)
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [incomeAmount, setIncomeAmount] = useState("")
  const [incomeDesc, setIncomeDesc] = useState("")

  const today = getToday()
  const daysLeft = Math.max(0, daysBetween(today, BUDGET_CONFIG.endDate))
  const totalFixed = BUDGET_CONFIG.fixedBills.reduce((s, b) => s + b.amount, 0)
  const totalIncome = store.income.reduce((s, i) => s + i.amount, 0)

  // Budget allocation: split savings across March remaining + April
  const marchEnd = "2026-03-31"
  const aprilStart = "2026-04-01"
  const daysInMarch = Math.max(0, daysBetween(today, marchEnd) + 1)
  const daysInApril = Math.max(0, daysBetween(aprilStart, BUDGET_CONFIG.endDate))
  const totalDaysLeft = daysInMarch + daysInApril

  const savingsAfterBills = BUDGET_CONFIG.totalSavings + totalIncome - totalFixed
  const dailyFromSavings = totalDaysLeft > 0 ? savingsAfterBills / totalDaysLeft : 0
  const marchAllocation = Math.round(dailyFromSavings * daysInMarch)
  const aprilAllocation = Math.round(dailyFromSavings * daysInApril)

  // March: spending cash + march savings allocation
  const marchBudget = BUDGET_CONFIG.spendingCash + marchAllocation
  // Total variable budget
  const variableBudget = BUDGET_CONFIG.spendingCash + savingsAfterBills
  const totalSpent = store.expenses.reduce((s, e) => s + e.amount, 0)
  const remaining = variableBudget - totalSpent
  const dailyAllowance = daysLeft > 0 ? remaining / daysLeft : 0

  const todayExpenses = store.expenses.filter((e) => e.date === today)
  const todaySpent = todayExpenses.reduce((s, e) => s + e.amount, 0)

  const overBudget = todaySpent > dailyAllowance
  const dangerZone = remaining < 500

  // Weekly chart
  const last7Days = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const daySpent = store.expenses.filter((e) => e.date === ds).reduce((s, e) => s + e.amount, 0)
      return { date: ds, spent: daySpent, label: d.toLocaleDateString("en-MY", { weekday: "short" }) }
    })
  }, [store.expenses])

  const maxDaySpent = Math.max(...last7Days.map((d) => d.spent), dailyAllowance, 1)

  // Category breakdown
  const spentByCategory = useMemo(() => {
    return CATEGORIES.map((c) => ({
      ...c,
      total: store.expenses.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
    })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total)
  }, [store.expenses])

  // Monthly summary
  const monthlyBreakdown = useMemo(() => {
    const months: Record<string, { spent: number; count: number }> = {}
    store.expenses.forEach((e) => {
      const m = e.date.substring(0, 7)
      if (!months[m]) months[m] = { spent: 0, count: 0 }
      months[m].spent += e.amount
      months[m].count++
    })
    return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0]))
  }, [store.expenses])

  const addExpense = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    store.addExpense({
      date: today,
      amount: val,
      desc: desc || getCategoryById(category).label,
      category,
      source: "manual",
    })
    setAmount("")
    setDesc("")
  }

  const addInc = () => {
    const val = parseFloat(incomeAmount)
    if (!val || val <= 0) return
    store.addIncome({ date: today, amount: val, desc: incomeDesc || "Income" })
    setIncomeAmount("")
    setIncomeDesc("")
    setShowAddIncome(false)
  }

  const handleScanConfirm = (results: ScanResult[]) => {
    store.addExpenses(
      results.map((r) => ({
        date: r.date,
        amount: r.amount,
        desc: r.desc,
        category: r.category,
        source: "scan" as const,
      }))
    )
  }

  return (
    <main className="max-w-md mx-auto px-4 py-6 pb-20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Alex&apos;s Budget Tracker</h1>
          <p className="text-xs text-muted-foreground font-mono">Apr 25</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Balance card */}
      <Card className={`mb-4 ${dangerZone ? "border-destructive/30" : ""}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-normal text-muted-foreground">Remaining budget</CardTitle>
          <p className={`text-3xl font-mono font-bold ${dangerZone ? "text-destructive" : "text-primary"}`}>
            {formatRM(remaining)}
          </p>
          <p className="text-xs text-muted-foreground">
            of {formatRM(variableBudget)} &middot; spent {formatRM(totalSpent)}
          </p>
        </CardHeader>
        <CardContent>
          <Progress
            value={Math.min(100, (totalSpent / variableBudget) * 100)}
            className="h-1.5"
            indicatorClassName={dangerZone ? "bg-destructive" : "bg-primary"}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="font-mono">{formatRM(dailyAllowance)}/day</span>
            <span>{((totalSpent / variableBudget) * 100).toFixed(0)}% used</span>
          </div>
        </CardContent>
      </Card>

      {/* Allocation cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">March left</p>
          <p className="font-mono font-semibold">{formatRM(marchBudget)}</p>
          <p className="text-xs text-muted-foreground">{daysInMarch} days</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">April budget</p>
          <p className="font-mono font-semibold">{formatRM(aprilAllocation)}</p>
          <p className="text-xs text-muted-foreground">{daysInApril} days</p>
        </Card>
      </div>

      {/* Today card - green filled */}
      <Card className={`mb-4 ${overBudget ? "bg-destructive text-destructive-foreground border-destructive" : "bg-primary text-primary-foreground border-primary"}`}>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Today</p>
            <p className="text-2xl font-mono font-bold mt-1">{formatRM(todaySpent)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">budget</p>
            <p className="text-lg font-mono opacity-90">{formatRM(dailyAllowance)}</p>
          </div>
        </div>
        <div className="px-5 pb-4">
          <div className="h-1 rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/80 transition-all"
              style={{ width: `${Math.min(100, dailyAllowance > 0 ? (todaySpent / dailyAllowance) * 100 : 0)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Quick add */}
      <Card className="mb-4 p-4">
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                category === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="RM"
            type="number"
            step="0.10"
            className="w-20 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && addExpense()}
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What for?"
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && addExpense()}
          />
          <Button size="default" onClick={addExpense} className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs text-muted-foreground"
          onClick={() => setScanOpen(true)}
        >
          <FileUp className="w-3.5 h-3.5 mr-1.5" />
          Scan bank statement (PDF)
        </Button>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Today tab */}
        <TabsContent value="today">
          {todayExpenses.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">No spending yet today</p>
          ) : (
            <div className="space-y-1">
              {todayExpenses.map((e) => {
                const cat = getCategoryById(e.category)
                return (
                  <div key={e.id} className="flex items-center justify-between py-2.5 group">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{cat.emoji}</span>
                      <div>
                        <p className="text-sm">{e.desc}</p>
                        <p className="text-xs text-muted-foreground">{cat.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{formatRM(e.amount)}</span>
                      <button
                        onClick={() => store.deleteExpense(e.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Week tab */}
        <TabsContent value="week">
          <div className="flex gap-1.5 items-end h-28 mb-4">
            {last7Days.map((d) => {
              const h = (d.spent / maxDaySpent) * 100
              const isToday = d.date === today
              const over = d.spent > dailyAllowance
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {d.spent > 0 ? Math.round(d.spent) : ""}
                  </span>
                  <div
                    className={`w-full rounded-md transition-all ${
                      over ? "bg-destructive" : isToday ? "bg-primary" : "bg-secondary"
                    }`}
                    style={{ height: `${Math.max(h, 3)}%`, minHeight: 2 }}
                  />
                  <span className={`text-[11px] ${isToday ? "font-semibold" : "text-muted-foreground"}`}>
                    {d.label}
                  </span>
                </div>
              )
            })}
          </div>
          {spentByCategory.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">By category</p>
              {spentByCategory.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{c.emoji}</span>
                    <span className="text-sm">{c.label}</span>
                  </div>
                  <span className="font-mono text-sm" style={{ color: c.color }}>{formatRM(c.total)}</span>
                </div>
              ))}
            </>
          )}
        </TabsContent>

        {/* Bills tab */}
        <TabsContent value="bills">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Fixed bills &middot; {formatRM(totalFixed)}
          </p>
          {BUDGET_CONFIG.fixedBills.map((b) => (
            <div
              key={b.name}
              onClick={() => store.toggleBill(b.name)}
              className={`flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer transition-opacity ${
                store.billsPaid[b.name] ? "opacity-40" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  store.billsPaid[b.name] ? "border-primary bg-primary" : "border-border"
                }`}>
                  {store.billsPaid[b.name] && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div>
                  <p className={`text-sm ${store.billsPaid[b.name] ? "line-through" : ""}`}>{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.due}</p>
                </div>
              </div>
              <span className="font-mono text-sm">{formatRM(b.amount)}</span>
            </div>
          ))}

          <p className="text-xs font-medium text-muted-foreground mt-6 mb-3 uppercase tracking-wide">Incoming</p>
          {store.income.map((i) => (
            <div key={i.id} className="flex justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm">{i.desc}</p>
                <p className="text-xs text-muted-foreground">{formatDate(i.date)}</p>
              </div>
              <span className="font-mono text-sm text-primary">+{formatRM(i.amount)}</span>
            </div>
          ))}
          {showAddIncome ? (
            <div className="flex gap-2 mt-2">
              <input
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="RM"
                type="number"
                className="w-20 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                value={incomeDesc}
                onChange={(e) => setIncomeDesc(e.target.value)}
                placeholder="e.g. Fly payout"
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button size="default" onClick={addInc} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={() => setShowAddIncome(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add incoming money
            </Button>
          )}
        </TabsContent>

        {/* Summary tab */}
        <TabsContent value="summary">
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Budget allocation</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total savings</span>
                  <span className="font-mono">{formatRM(BUDGET_CONFIG.totalSavings)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Spending cash</span>
                  <span className="font-mono">{formatRM(BUDGET_CONFIG.spendingCash)}</span>
                </div>
                {totalIncome > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Additional income</span>
                    <span className="font-mono text-primary">+{formatRM(totalIncome)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Fixed bills</span>
                  <span className="font-mono text-destructive">-{formatRM(totalFixed)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-medium">
                  <span>Variable budget</span>
                  <span className="font-mono">{formatRM(variableBudget)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Recommended daily</p>
              <p className="text-2xl font-mono font-bold text-primary">{formatRM(dailyAllowance)}</p>
              <p className="text-xs text-muted-foreground mt-1">{daysLeft} days remaining to Apr 25</p>
            </Card>

            {monthlyBreakdown.length > 0 && (
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Monthly totals</p>
                {monthlyBreakdown.map(([month, data]) => (
                  <div key={month} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                    <div>
                      <span>{new Date(month + "-01").toLocaleDateString("en-MY", { month: "long", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground ml-2">({data.count} txns)</span>
                    </div>
                    <span className="font-mono">{formatRM(data.spent)}</span>
                  </div>
                ))}
              </Card>
            )}

            {spentByCategory.length > 0 && (
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Top categories</p>
                {spentByCategory.slice(0, 5).map((c) => {
                  const pct = totalSpent > 0 ? (c.total / totalSpent) * 100 : 0
                  return (
                    <div key={c.id} className="mb-3 last:mb-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{c.emoji} {c.label}</span>
                        <span className="font-mono">{formatRM(c.total)} <span className="text-xs text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <Progress value={pct} className="h-1" indicatorClassName="bg-primary" />
                    </div>
                  )
                })}
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ScanModal open={scanOpen} onOpenChange={setScanOpen} onConfirm={handleScanConfirm} />
    </main>
  )
}
