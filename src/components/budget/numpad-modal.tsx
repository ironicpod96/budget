"use client"

import { useState } from "react"
import { CATEGORIES, CATEGORY_IDS, CategoryId, COLORS } from "@/lib/config"

interface NumpadModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (amount: number, category: CategoryId, desc: string) => void
}

export function NumpadModal({ open, onClose, onSubmit }: NumpadModalProps) {
  const [value, setValue] = useState("0")
  const [category, setCategory] = useState<CategoryId>("food")
  const [desc, setDesc] = useState("")

  if (!open) return null

  const handleKey = (key: string) => {
    if (key === "backspace") {
      setValue(v => v.length <= 1 ? "0" : v.slice(0, -1))
    } else if (key === ".") {
      if (!value.includes(".")) setValue(v => v + ".")
    } else {
      setValue(v => v === "0" ? key : v + key)
    }
  }

  const handleSubmit = () => {
    const amount = parseFloat(value)
    if (amount > 0) {
      onSubmit(amount, category, desc || CATEGORIES[category].label)
      setValue("0")
      setDesc("")
      onClose()
    }
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-t-[24px] p-6 pb-8"
        style={{ backgroundColor: COLORS.card }}
      >
        {/* Category pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {CATEGORY_IDS.map((id) => {
            const c = CATEGORIES[id]
            const active = category === id
            return (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors"
                style={{
                  backgroundColor: active ? c.color + "20" : COLORS.track,
                  color: active ? c.color : "rgba(255,255,255,0.6)",
                  border: active ? `1.5px solid ${c.color}` : "1.5px solid transparent",
                }}
              >
                {c.emoji} {c.label}
              </button>
            )
          })}
        </div>

        {/* Amount display */}
        <div className="text-center mb-4">
          <span className="text-[40px] font-bold text-white font-mono tracking-tight">
            RM{value}
          </span>
        </div>

        {/* Description */}
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What for? (optional)"
          className="w-full px-4 py-3 rounded-xl text-sm text-white/80 placeholder:text-white/30 mb-5 border-none outline-none"
          style={{ backgroundColor: COLORS.track }}
        />

        {/* Numpad grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="h-14 rounded-xl text-xl font-medium text-white flex items-center justify-center active:scale-95 transition-transform"
              style={{ backgroundColor: COLORS.track }}
            >
              {key === "backspace" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : key}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full h-14 rounded-xl text-base font-semibold text-white flex items-center justify-center active:scale-[0.98] transition-transform"
          style={{ backgroundColor: COLORS.green }}
        >
          Add Expense
        </button>
      </div>
    </div>
  )
}
