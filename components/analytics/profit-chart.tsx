"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { ChartPoint } from "@/lib/analytics/types"

interface ProfitChartProps {
  data: ChartPoint[]
}

interface TooltipPayloadItem {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const isNeg = value < 0
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-dropdown">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-semibold ${
          isNeg ? "text-red-700" : "text-emerald-700"
        }`}
      >
        ₺{value.toLocaleString("tr-TR")}
      </p>
    </div>
  )
}

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

export function ProfitChart({ data }: ProfitChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Gösterilecek veri yok
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#E7E7E0" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "#71717A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fill: "#71717A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#5E6B5C"
          strokeWidth={2}
          fill="#5E6B5C"
          fillOpacity={0.08}
          dot={false}
          activeDot={{ r: 4, fill: "#5E6B5C", stroke: "#FFFFFF", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
