"use client"

import { COLORS } from "@/lib/config"

interface EnvelopeBarProps {
  label: string
  spent: number
  budget: number
  color: string
  onTap?: () => void
}

export function EnvelopeBar({ label, spent, budget, color, onTap }: EnvelopeBarProps) {
  const pct = budget > 0 ? spent / budget : 0
  const overBudget = spent > budget
  const overage = overBudget ? spent - budget : 0

  let barColor = color
  if (pct > 0.7 && pct <= 0.9) barColor = COLORS.amber
  if (pct > 0.9) barColor = COLORS.red

  const fillWidth = overBudget ? 100 : Math.min(100, pct * 100)

  return (
    <button
      onClick={onTap}
      className="flex items-center gap-[11px] w-full group"
    >
      <span className="text-[12px] font-medium text-white/60 w-[60px] text-left shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-2 flex-1">
        <div
          className="h-[8px] rounded-full flex-1 relative overflow-hidden"
          style={{ backgroundColor: COLORS.bg }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${fillWidth}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        {overBudget && (
          <span className="text-[11px] font-semibold text-[#D11F22] whitespace-nowrap">
            +RM{Math.round(overage)}
          </span>
        )}
      </div>
    </button>
  )
}
