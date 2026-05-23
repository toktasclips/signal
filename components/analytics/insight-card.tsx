import { TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"
import { InsightCard as InsightCardType } from "@/lib/analytics/types"

interface InsightCardProps {
  insight: InsightCardType
}

export function InsightCard({ insight }: InsightCardProps) {
  const config = {
    positive: {
      borderColor: "border-l-emerald-500",
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-400/5",
      Icon: TrendingUp,
    },
    warning: {
      borderColor: "border-l-amber-500",
      iconColor: "text-amber-400",
      bgColor: "bg-amber-400/5",
      Icon: AlertTriangle,
    },
    neutral: {
      borderColor: "border-l-violet-500",
      iconColor: "text-violet-400",
      bgColor: "bg-violet-400/5",
      Icon: Lightbulb,
    },
  }[insight.type]

  const { Icon } = config

  return (
    <div
      className={`bg-[#111111] border border-[#222222] border-l-4 ${config.borderColor} rounded-xl p-4 flex gap-3`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}
      >
        <Icon size={16} className={config.iconColor} />
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-semibold text-zinc-100 leading-snug">
          {insight.title}
        </span>
        <span className="text-xs text-zinc-500 leading-relaxed">
          {insight.description}
        </span>
      </div>
    </div>
  )
}
