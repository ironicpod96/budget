"use client"

import { useState, useEffect, useCallback } from "react"
import { Expense, Income, BillItem, Envelope, UserConfig, CategoryId, CATEGORIES, CATEGORY_IDS } from "@/lib/config"

function useLS<T>(key: string, init: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(init)
  useEffect(() => {
    try {
      const s = localStorage.getItem(key)
      if (s) setVal(JSON.parse(s))
    } catch { /* empty */ }
  }, [key])
  const set = useCallback((v: T) => {
    setVal(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* empty */ }
  }, [key])
  return [val, set]
}

const defaultEnvelopes: Envelope[] = CATEGORY_IDS.map((id) => ({
  id,
  label: CATEGORIES[id].label,
  emoji: CATEGORIES[id].emoji,
  budget: 0,
  color: CATEGORIES[id].color,
}))

const defaultConfig: UserConfig = {
  salary: { gross: 0, bonus: 0, epfRate: 0.11, employerEpfRate: 0.13 },
  bills: [],
  envelopes: defaultEnvelopes,
  onboarded: false,
}

export function useBudgetStore() {
  const [expenses, setExpenses] = useLS<Expense[]>("bgt:expenses", [])
  const [income, setIncome] = useLS<Income[]>("bgt:income", [])
  const [config, setConfig] = useLS<UserConfig>("bgt:config", defaultConfig)

  const addExpense = useCallback((e: Omit<Expense, "id" | "created_at">) => {
    setExpenses([...expenses, { ...e, id: crypto.randomUUID(), created_at: new Date().toISOString() }])
  }, [expenses, setExpenses])

  const addExpenses = useCallback((items: Omit<Expense, "id" | "created_at">[]) => {
    const mapped = items.map(e => ({ ...e, id: crypto.randomUUID(), created_at: new Date().toISOString() }))
    setExpenses([...expenses, ...mapped])
  }, [expenses, setExpenses])

  const deleteExpense = useCallback((id: string) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }, [expenses, setExpenses])

  const addIncome = useCallback((i: Omit<Income, "id" | "created_at">) => {
    setIncome([...income, { ...i, id: crypto.randomUUID(), created_at: new Date().toISOString() }])
  }, [income, setIncome])

  const updateConfig = useCallback((updates: Partial<UserConfig>) => {
    setConfig({ ...config, ...updates })
  }, [config, setConfig])

  const updateEnvelope = useCallback((id: CategoryId, budget: number) => {
    const updated = config.envelopes.map(e => e.id === id ? { ...e, budget } : e)
    setConfig({ ...config, envelopes: updated })
  }, [config, setConfig])

  const toggleBillPaid = useCallback((billId: string) => {
    const updated = config.bills.map(b => b.id === billId ? { ...b, paid: !b.paid } : b)
    setConfig({ ...config, bills: updated })
  }, [config, setConfig])

  const addBill = useCallback((bill: Omit<BillItem, "id" | "paid">) => {
    const newBill: BillItem = { ...bill, id: crypto.randomUUID(), paid: false }
    setConfig({ ...config, bills: [...config.bills, newBill] })
  }, [config, setConfig])

  const removeBill = useCallback((id: string) => {
    setConfig({ ...config, bills: config.bills.filter(b => b.id !== id) })
  }, [config, setConfig])

  return {
    expenses, income, config,
    addExpense, addExpenses, deleteExpense,
    addIncome,
    updateConfig, updateEnvelope,
    toggleBillPaid, addBill, removeBill,
  }
}
