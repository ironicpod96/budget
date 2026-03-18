"use client"

import { formatRM, COLORS } from "@/lib/config"

interface DonutProps {
  spent: number
  budget: number
  size?: number
}

export function Donut({ spent, budget, size = 164 }: DonutProps) {
  const remaining = Math.max(0, budget - spent)
  const pct = budget > 0 ? Math.min(1, spent / budget) : 0

  // Color based on spending pressure
  let arcColor = COLORS.green
  if (pct > 0.7) arcColor = COLORS.amber
  if (pct > 0.9) arcColor = COLORS.red

  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Arc */}
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
          />
        )}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-bold tracking-tight text-white font-mono">
          {formatRM(remaining)}
        </span>
        <span className="text-[16px] font-semibold text-white/60">
          left
        </span>
      </div>
    </div>
  )
}
