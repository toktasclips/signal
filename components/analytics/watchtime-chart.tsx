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
  revenue: number
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
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-dropdown">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground tabular-nums">
            {entry.name === "Toplam Gelir"
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
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
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
        <CartesianGrid stroke="#E7E7E0" strokeDasharray="3 3" vertical={false} />
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
          stroke="#B68B2D"
          strokeWidth={2}
          dot={{ r: 3, fill: "#B68B2D", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#B68B2D", stroke: "#FFFFFF", strokeWidth: 2 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          name="Toplam Gelir"
          stroke="#5E6B5C"
          strokeWidth={2}
          dot={{ r: 3, fill: "#5E6B5C", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#5E6B5C", stroke: "#FFFFFF", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
