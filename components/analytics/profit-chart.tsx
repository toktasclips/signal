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
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p
        className={`text-sm font-semibold ${
          isNeg ? "text-red-400" : "text-emerald-400"
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
      <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
        Gösterilecek veri yok
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitNegGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1F1F1F" strokeDasharray="3 3" vertical={false} />
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
          stroke="#10B981"
          strokeWidth={2}
          fill="url(#profitGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#10B981", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
