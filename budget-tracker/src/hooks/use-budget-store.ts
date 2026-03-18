"use client"

import { useState, useEffect, useCallback } from "react"
import { Expense, Income, BillStatus } from "@/types"

function useLocalStorage<T>(key: string, initial: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(initial)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) setValue(JSON.parse(stored))
    } catch {}
  }, [key])

  const set = useCallback(
    (val: T) => {
      setValue(val)
      try {
        localStorage.setItem(key, JSON.stringify(val))
      } catch {}
    },
    [key]
  )

  return [value, set]
}

export function useBudgetStore() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("budget:expenses", [])
  const [income, setIncome] = useLocalStorage<Income[]>("budget:income", [])
  const [billsPaid, setBillsPaid] = useLocalStorage<BillStatus>("budget:billsPaid", {})

  const addExpense = useCallback(
    (expense: Omit<Expense, "id" | "created_at">) => {
      const newExp: Expense = {
        ...expense,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      setExpenses([...expenses, newExp])
    },
    [expenses, setExpenses]
  )

  const addExpenses = useCallback(
    (newExpenses: Omit<Expense, "id" | "created_at">[]) => {
      const mapped = newExpenses.map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }))
      setExpenses([...expenses, ...mapped])
    },
    [expenses, setExpenses]
  )

  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses(expenses.filter((e) => e.id !== id))
    },
    [expenses, setExpenses]
  )

  const updateExpense = useCallback(
    (id: string, updates: Partial<Expense>) => {
      setExpenses(expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)))
    },
    [expenses, setExpenses]
  )

  const addIncome = useCallback(
    (inc: Omit<Income, "id" | "created_at">) => {
      const newInc: Income = {
        ...inc,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      setIncome([...income, newInc])
    },
    [income, setIncome]
  )

  const toggleBill = useCallback(
    (name: string) => {
      setBillsPaid({ ...billsPaid, [name]: !billsPaid[name] })
    },
    [billsPaid, setBillsPaid]
  )

  const resetAll = useCallback(() => {
    setExpenses([])
    setIncome([])
    setBillsPaid({})
  }, [setExpenses, setIncome, setBillsPaid])

  return {
    expenses,
    income,
    billsPaid,
    addExpense,
    addExpenses,
    deleteExpense,
    updateExpense,
    addIncome,
    toggleBill,
    resetAll,
  }
}
