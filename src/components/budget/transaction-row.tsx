"use client"

import { CATEGORIES, CategoryId, COLORS } from "@/lib/config"

interface TransactionRowProps {
  category: CategoryId
  desc: string
  amount: number
  onDelete?: () => void
}

export function TransactionRow({ category, desc, amount, onDelete }: TransactionRowProps) {
  const cat = CATEGORIES[category]

  return (
    <div
      className="flex items-center justify-between px-6 py-3 rounded-[20px] group"
      style={{ backgroundColor: COLORS.card }}
    >
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: COLORS.track }}
        >
          {cat.emoji}
        </div>
        <span className="text-[17px] text-white/60">{desc}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[22px] font-bold text-white/60 tracking-tight font-mono">
          RM {Math.round(amount)}
        </span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-[#D11F22] transition-opacity text-sm"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
