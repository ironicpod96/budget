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
  const totalFixed = BUDGET_CONFIG.fixedBills.reduce((s, b) => s + b.amount, 0)
  const totalIncome = store.income.reduce((s, i) => s + i.amount, 0)

  // Budget allocation: split across March remaining + April
  const marchEnd = "2026-03-31"
  const aprilStart = "2026-04-01"
  const daysLeftMarch = Math.max(0, daysBetween(today, marchEnd) + 1)
  const daysInApril = Math.max(0, daysBetween(aprilStart, BUDGET_CONFIG.endDate))
  const totalDaysLeft = daysLeftMarch + daysInApril

  // Total variable = spending cash + savings - fixed bills + any extra income
  const totalVariable = BUDGET_CONFIG.spendingCash + BUDGET_CONFIG.totalSavings + totalIncome - totalFixed
  const dailyRate = totalDaysLeft > 0 ? totalVariable / totalDaysLeft : 0
  const marchBudget = Math.round(dailyRate * daysLeftMarch)
  const aprilBudget = Math.round(dailyRate * daysInApril)

  // Current month context: are we in March or April?
  const currentMonth = new Date().getMonth() // 2 = March, 3 = April
  const isMarch = currentMonth === 2
  const currentMonthBudget = isMarch ? marchBudget : aprilBudget
  const currentMonthDays = isMarch ? daysLeftMarch : daysInApril
  const currentMonthLabel = isMarch ? "March" : "April"
  const otherMonthLabel = isMarch ? "April" : "March"
  const otherMonthBudget = isMarch ? aprilBudget : marchBudget
  const otherMonthDays = isMarch ? daysInApril : daysLeftMarch

  // Spending for current month only
  const currentMonthPrefix = isMarch ? "2026-03" : "2026-04"
  const currentMonthExpenses = store.expenses.filter((e) => e.date.startsWith(currentMonthPrefix))
  const currentMonthSpent = currentMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const currentMonthRemaining = currentMonthBudget - currentMonthSpent
  const currentDailyAllowance = currentMonthDays > 0 ? currentMonthRemaining / currentMonthDays : 0

  // Total across all time
  const totalSpent = store.expenses.reduce((s, e) => s + e.amount, 0)
  const totalRemaining = totalVariable - totalSpent

  // Today
  const todayExpenses = store.expenses.filter((e) => e.date === today)
  const todaySpent = todayExpenses.reduce((s, e) => s + e.amount, 0)

  const overBudget = todaySpent > currentDailyAllowance
  const dangerZone = currentMonthRemaining < 300

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

  const maxDaySpent = Math.max(...last7Days.map((d) => d.spent), currentDailyAllowance, 1)

  // Category breakdown (current month)
  const spentByCategory = useMemo(() => {
    return CATEGORIES.map((c) => ({
      ...c,
      total: currentMonthExpenses.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
    })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total)
  }, [currentMonthExpenses])

  // Monthly summary (all time)
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
    <main className="max-w-lg mx-auto px-5 py-8 pb-24 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Alex&apos;s Budget Tracker</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Apr 25</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Balance card - current month focus */}
      <Card className={`mb-5 ${dangerZone ? "border-destructive/30" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-normal text-muted-foreground">{currentMonthLabel} remaining</CardTitle>
          <p className={`text-5xl font-mono font-bold tracking-tight ${dangerZone ? "text-destructive" : "text-primary"}`}>
            {formatRM(currentMonthRemaining)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            of {formatRM(currentMonthBudget)} &middot; spent {formatRM(currentMonthSpent)}
          </p>
        </CardHeader>
        <CardContent>
          <Progress
            value={Math.min(100, currentMonthBudget > 0 ? (currentMonthSpent / currentMonthBudget) * 100 : 0)}
            className="h-2"
            indicatorClassName={dangerZone ? "bg-destructive" : "bg-primary"}
          />
          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
            <span className="font-mono">{formatRM(currentDailyAllowance)}/day</span>
            <span>{currentMonthBudget > 0 ? ((currentMonthSpent / currentMonthBudget) * 100).toFixed(0) : 0}% used</span>
          </div>
        </CardContent>
      </Card>

      {/* Allocation cards */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <Card className={`p-5 ${isMarch ? "border-primary/30 bg-primary/5" : ""}`}>
          <p className="text-sm text-muted-foreground mb-1">March</p>
          <p className="font-mono font-bold text-xl">{formatRM(marchBudget)}</p>
          <p className="text-sm text-muted-foreground mt-1">{daysLeftMarch} days left</p>
        </Card>
        <Card className={`p-5 ${!isMarch ? "border-primary/30 bg-primary/5" : ""}`}>
          <p className="text-sm text-muted-foreground mb-1">April</p>
          <p className="font-mono font-bold text-xl">{formatRM(aprilBudget)}</p>
          <p className="text-sm text-muted-foreground mt-1">{daysInApril} days</p>
        </Card>
      </div>

      {/* Today card - green filled */}
      <Card className={`mb-5 ${overBudget ? "bg-destructive text-destructive-foreground border-destructive" : "bg-primary text-primary-foreground border-primary"}`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Today</p>
            <p className="text-4xl font-mono font-bold mt-1">{formatRM(todaySpent)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">budget</p>
            <p className="text-2xl font-mono opacity-90">{formatRM(currentDailyAllowance)}</p>
          </div>
        </div>
        <div className="px-6 pb-5">
          <div className="h-1.5 rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/80 transition-all"
              style={{ width: `${Math.min(100, currentDailyAllowance > 0 ? (todaySpent / currentDailyAllowance) * 100 : 0)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Quick add */}
      <Card className="mb-5 p-5">
        <div className="flex gap-2 mb-4 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-sm px-3 py-2 rounded-full transition-colors ${
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
            className="w-24 px-4 py-3 rounded-lg border border-input bg-background text-base font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && addExpense()}
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What for?"
            className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && addExpense()}
          />
          <Button size="lg" onClick={addExpense} className="shrink-0 h-12 w-12">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="default"
          className="w-full mt-3 text-sm text-muted-foreground"
          onClick={() => setScanOpen(true)}
        >
          <FileUp className="w-4 h-4 mr-2" />
          Scan bank statement (PDF)
        </Button>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="today">
        <TabsList className="h-12">
          <TabsTrigger value="today" className="text-sm">Today</TabsTrigger>
          <TabsTrigger value="week" className="text-sm">Week</TabsTrigger>
          <TabsTrigger value="bills" className="text-sm">Bills</TabsTrigger>
          <TabsTrigger value="summary" className="text-sm">Summary</TabsTrigger>
        </TabsList>

        {/* Today tab */}
        <TabsContent value="today">
          {todayExpenses.length === 0 ? (
            <p className="text-center py-14 text-base text-muted-foreground">No spending yet today</p>
          ) : (
            <div className="space-y-1">
              {todayExpenses.map((e) => {
                const cat = getCategoryById(e.category)
                return (
                  <div key={e.id} className="flex items-center justify-between py-3.5 group">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.emoji}</span>
                      <div>
                        <p className="text-base">{e.desc}</p>
                        <p className="text-sm text-muted-foreground">{cat.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base">{formatRM(e.amount)}</span>
                      <button
                        onClick={() => store.deleteExpense(e.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <div className="flex gap-2 items-end h-36 mb-5">
            {last7Days.map((d) => {
              const h = (d.spent / maxDaySpent) * 100
              const isToday = d.date === today
              const over = d.spent > currentDailyAllowance
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-mono text-muted-foreground">
                    {d.spent > 0 ? Math.round(d.spent) : ""}
                  </span>
                  <div
                    className={`w-full rounded-lg transition-all ${
                      over ? "bg-destructive" : isToday ? "bg-primary" : "bg-secondary"
                    }`}
                    style={{ height: `${Math.max(h, 3)}%`, minHeight: 4 }}
                  />
                  <span className={`text-sm ${isToday ? "font-semibold" : "text-muted-foreground"}`}>
                    {d.label}
                  </span>
                </div>
              )
            })}
          </div>
          {spentByCategory.length > 0 && (
            <>
              <p className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">By category ({currentMonthLabel})</p>
              {spentByCategory.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-base">{c.label}</span>
                  </div>
                  <span className="font-mono text-base" style={{ color: c.color }}>{formatRM(c.total)}</span>
                </div>
              ))}
            </>
          )}
        </TabsContent>

        {/* Bills tab */}
        <TabsContent value="bills">
          <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
            Fixed bills &middot; {formatRM(totalFixed)}
          </p>
          {BUDGET_CONFIG.fixedBills.map((b) => (
            <div
              key={b.name}
              onClick={() => store.toggleBill(b.name)}
              className={`flex items-center justify-between py-4 border-b border-border last:border-0 cursor-pointer transition-opacity ${
                store.billsPaid[b.name] ? "opacity-40" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                  store.billsPaid[b.name] ? "border-primary bg-primary" : "border-border"
                }`}>
                  {store.billsPaid[b.name] && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
                <div>
                  <p className={`text-base ${store.billsPaid[b.name] ? "line-through" : ""}`}>{b.name}</p>
                  <p className="text-sm text-muted-foreground">{b.due}</p>
                </div>
              </div>
              <span className="font-mono text-base">{formatRM(b.amount)}</span>
            </div>
          ))}

          <p className="text-sm font-medium text-muted-foreground mt-8 mb-4 uppercase tracking-wide">Incoming</p>
          {store.income.map((i) => (
            <div key={i.id} className="flex justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-base">{i.desc}</p>
                <p className="text-sm text-muted-foreground">{formatDate(i.date)}</p>
              </div>
              <span className="font-mono text-base text-primary">+{formatRM(i.amount)}</span>
            </div>
          ))}
          {showAddIncome ? (
            <div className="flex gap-2 mt-3">
              <input
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="RM"
                type="number"
                className="w-24 px-4 py-3 rounded-lg border border-input bg-background text-base font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                value={incomeDesc}
                onChange={(e) => setIncomeDesc(e.target.value)}
                placeholder="e.g. Fly payout"
                className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button size="lg" onClick={addInc} className="shrink-0 h-12 w-12">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="default" className="w-full mt-3 text-sm" onClick={() => setShowAddIncome(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add incoming money
            </Button>
          )}
        </TabsContent>

        {/* Summary tab */}
        <TabsContent value="summary">
          <div className="space-y-5">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide font-medium">Budget allocation</p>
              <div className="space-y-4">
                <div className="flex justify-between text-base">
                  <span>Total savings</span>
                  <span className="font-mono">{formatRM(BUDGET_CONFIG.totalSavings)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span>Spending cash</span>
                  <span className="font-mono">{formatRM(BUDGET_CONFIG.spendingCash)}</span>
                </div>
                {totalIncome > 0 && (
                  <div className="flex justify-between text-base">
                    <span>Additional income</span>
                    <span className="font-mono text-primary">+{formatRM(totalIncome)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base">
                  <span>Fixed bills</span>
                  <span className="font-mono text-destructive">-{formatRM(totalFixed)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
                  <span>Variable budget</span>
                  <span className="font-mono">{formatRM(totalVariable)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide font-medium">Recommended daily</p>
              <p className="text-4xl font-mono font-bold text-primary">{formatRM(currentDailyAllowance)}</p>
              <p className="text-sm text-muted-foreground mt-2">{currentMonthDays} days left in {currentMonthLabel}</p>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide font-medium">Overall</p>
              <div className="flex justify-between text-base">
                <span>Total remaining</span>
                <span className="font-mono font-semibold">{formatRM(totalRemaining)}</span>
              </div>
              <div className="flex justify-between text-base mt-2">
                <span>Total spent</span>
                <span className="font-mono">{formatRM(totalSpent)}</span>
              </div>
              <div className="flex justify-between text-base mt-2">
                <span>Daily rate (all)</span>
                <span className="font-mono">{formatRM(dailyRate)}</span>
              </div>
            </Card>

            {monthlyBreakdown.length > 0 && (
              <Card className="p-5">
                <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide font-medium">Monthly totals</p>
                {monthlyBreakdown.map(([month, data]) => (
                  <div key={month} className="flex justify-between py-3 border-b border-border last:border-0 text-base">
                    <div>
                      <span>{new Date(month + "-01").toLocaleDateString("en-MY", { month: "long", year: "numeric" })}</span>
                      <span className="text-sm text-muted-foreground ml-2">({data.count} txns)</span>
                    </div>
                    <span className="font-mono">{formatRM(data.spent)}</span>
                  </div>
                ))}
              </Card>
            )}

            {spentByCategory.length > 0 && (
              <Card className="p-5">
                <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wide font-medium">Top categories ({currentMonthLabel})</p>
                {spentByCategory.slice(0, 5).map((c) => {
                  const pct = currentMonthSpent > 0 ? (c.total / currentMonthSpent) * 100 : 0
                  return (
                    <div key={c.id} className="mb-4 last:mb-0">
                      <div className="flex justify-between text-base mb-1.5">
                        <span>{c.emoji} {c.label}</span>
                        <span className="font-mono">{formatRM(c.total)} <span className="text-sm text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <Progress value={pct} className="h-1.5" indicatorClassName="bg-primary" />
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
