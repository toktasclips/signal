import { TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"
import { InsightCard as InsightCardType } from "@/lib/analytics/types"

interface InsightCardProps {
  insight: InsightCardType
}

export function InsightCard({ insight }: InsightCardProps) {
  const config = {
    positive: {
      borderColor: "border-emerald-200/80",
      iconColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      Icon: TrendingUp,
    },
    warning: {
      borderColor: "border-amber-200/80",
      iconColor: "text-amber-700",
      bgColor: "bg-amber-50",
      Icon: AlertTriangle,
    },
    neutral: {
      borderColor: "border-border",
      iconColor: "text-primary",
      bgColor: "bg-muted/70",
      Icon: Lightbulb,
    },
  }[insight.type]

  const { Icon } = config

  return (
    <div
      className={`flex gap-3 rounded-xl border ${config.borderColor} bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}
      >
        <Icon size={16} className={config.iconColor} />
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-semibold leading-snug text-foreground">
          {insight.title}
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {insight.description}
        </span>
      </div>
    </div>
  )
}
