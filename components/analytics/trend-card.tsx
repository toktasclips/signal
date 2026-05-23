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
    ? "text-emerald-700"
    : isNegative
    ? "text-red-700"
    : "text-muted-foreground"

  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  const sparkData = sparklineData?.map((v, i) => ({ i, v })) ?? []
  const lineColor = isPositive ? "#5E6B5C" : isNegative ? "#DC2626" : "#71717A"

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-card">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>

      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums leading-none">
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
