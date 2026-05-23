"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from "recharts"

interface TrendCardProps {
  label: string
  currentValue: number | string
  change: number
  sparklineData?: number[]
  prefix?: string
  suffix?: string
}

export function TrendCard({
  label,
  currentValue,
  change,
  sparklineData,
  prefix = "",
  suffix = "",
}: TrendCardProps) {
  const isPositive = change > 0
  const isNegative = change < 0

  const changeColor = isPositive
    ? "text-emerald-400"
    : isNegative
    ? "text-red-400"
    : "text-zinc-500"

  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  const sparkData = sparklineData?.map((v, i) => ({ i, v })) ?? []
  const lineColor = isPositive ? "#10B981" : isNegative ? "#EF4444" : "#6B7280"

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 flex flex-col gap-2">
      <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
        {label}
      </span>

      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold text-zinc-100 tabular-nums leading-none">
            {prefix}
            {typeof currentValue === "number"
              ? currentValue.toLocaleString("tr-TR")
              : currentValue}
            {suffix}
          </span>

          <div className={`flex items-center gap-1 text-xs font-medium ${changeColor}`}>
            <ChangeIcon size={12} />
            <span>
              {change === 0 ? "0.0" : Math.abs(change).toFixed(1)}%{" "}
              {isPositive ? "↑" : isNegative ? "↓" : "–"}
            </span>
          </div>
        </div>

        {sparkData.length > 1 && (
          <div className="w-24 h-12 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Tooltip content={() => null} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
