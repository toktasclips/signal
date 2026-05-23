"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface WatchtimePoint {
  month: string
  watchHours: number
  mrr: number
}

interface WatchtimeChartProps {
  data: WatchtimePoint[]
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
            {entry.name === "MRR"
              ? `₺${entry.value.toLocaleString("tr-TR")}`
              : `${entry.value.toLocaleString("tr-TR")} sa`}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatK(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return String(value)
}

export function WatchtimeChart({ data }: WatchtimeChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
        Gösterilecek veri yok
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
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
          tickFormatter={formatK}
          tick={{ fill: "#71717A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={formatK}
          tick={{ fill: "#71717A", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#71717A" }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="watchHours"
          name="Watch Hours"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={{ r: 3, fill: "#F59E0B", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#F59E0B", strokeWidth: 0 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="mrr"
          name="MRR"
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={{ r: 3, fill: "#8B5CF6", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#8B5CF6", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
