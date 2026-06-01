import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  change?: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
}

export function KpiCard({ title, value, change, icon }: KpiCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isFlat = change !== undefined && change === 0

  const changeColor = isPositive
    ? "text-emerald-700"
    : isNegative
    ? "text-red-700"
    : "text-muted-foreground"

  const changeBg = isPositive
    ? "bg-emerald-50 border-emerald-200/80"
    : isNegative
    ? "bg-red-50 border-red-200/80"
    : "bg-muted/70 border-border"

  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className="flex min-h-[154px] flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {title}
        </span>
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
      </div>

      <div className="text-2xl font-semibold tracking-tight text-foreground tabular-nums leading-none">
        {value}
      </div>

      {change !== undefined && (
        <div
          className={`inline-flex items-center gap-1 self-start rounded-md border px-2 py-0.5 text-xs font-medium ${changeBg} ${changeColor}`}
        >
          <ChangeIcon size={11} />
          <span>
            {isFlat ? "0.0" : Math.abs(change).toFixed(1)}%{" "}
            {isPositive ? "artış" : isNegative ? "düşüş" : "değişim yok"}
          </span>
        </div>
      )}
      <div className="mt-auto flex h-4 items-end gap-1">
        {[28, 42, 36, 52, 44, 62].map((height, index) => (
          <span
            key={index}
            className="w-full rounded-sm bg-primary/10"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  )
}
