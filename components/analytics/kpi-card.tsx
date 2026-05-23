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
    ? "text-emerald-400"
    : isNegative
    ? "text-red-400"
    : "text-zinc-500"

  const changeBg = isPositive
    ? "bg-emerald-400/10"
    : isNegative
    ? "bg-red-400/10"
    : "bg-zinc-700/20"

  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
          {title}
        </span>
        {icon && <span className="text-zinc-600">{icon}</span>}
      </div>

      <div className="text-2xl font-bold text-zinc-100 tabular-nums leading-none">
        {value}
      </div>

      {change !== undefined && (
        <div
          className={`inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}
        >
          <ChangeIcon size={11} />
          <span>
            {isFlat ? "0.0" : Math.abs(change).toFixed(1)}%{" "}
            {isPositive ? "artış" : isNegative ? "düşüş" : "değişim yok"}
          </span>
        </div>
      )}
    </div>
  )
}
