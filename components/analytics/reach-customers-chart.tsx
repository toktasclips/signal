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
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
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
          fill="#5E6B5C"
          fillOpacity={0.28}
          radius={[3, 3, 0, 0]}
          maxBarSize={28}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="customers"
          name="Müşteri"
          stroke="#5E6B5C"
          strokeWidth={2}
          dot={{ r: 3, fill: "#5E6B5C", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#5E6B5C", stroke: "#FFFFFF", strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
