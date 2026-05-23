"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface ReachCustomersPoint {
  month: string
  reach: number
  customers: number
}

interface ReachCustomersChartProps {
  data: ReachCustomersPoint[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-500 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-400">{entry.name}:</span>
          <span className="text-zinc-100 font-medium tabular-nums">
            {entry.value.toLocaleString("tr-TR")}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatReach(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

export function ReachCustomersChart({ data }: ReachCustomersChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
        Gösterilecek veri yok
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid stroke="#1F1F1F" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "#71717A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={formatReach}
          tick={{ fill: "#71717A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "#71717A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#71717A" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          yAxisId="left"
          dataKey="reach"
          name="Reach"
          fill="#8B5CF6"
          fillOpacity={0.7}
          radius={[3, 3, 0, 0]}
          maxBarSize={28}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="customers"
          name="Müşteri"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ r: 3, fill: "#10B981", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#10B981", strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
