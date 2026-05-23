"use client"

import { useState } from "react"
import { mockQuarterReviews } from "@/lib/analytics/mock-data"
import { QuarterReview } from "@/lib/analytics/types"
import { CheckCircle, Loader2 } from "lucide-react"

const QUARTER_MONTHS: Record<number, string> = {
  1: "Ocak, Şubat, Mart",
  2: "Nisan, Mayıs, Haziran",
  3: "Temmuz, Ağustos, Eylül",
  4: "Ekim, Kasım, Aralık",
}

const YEAR = 2024

interface QuarterData {
  wins: string
  bottlenecks: string
  opportunities: string
  next_focus: string
}

function buildInitialData(): Record<number, QuarterData> {
  const result: Record<number, QuarterData> = {}
  for (let q = 1; q <= 4; q++) {
    const found = mockQuarterReviews.find((r) => r.quarter === q && r.year === YEAR)
    result[q] = {
      wins: found?.wins ?? "",
      bottlenecks: found?.bottlenecks ?? "",
      opportunities: found?.opportunities ?? "",
      next_focus: found?.next_focus ?? "",
    }
  }
  return result
}

const textareaClass =
  "w-full bg-[#0A0A0A] border border-[#222222] text-zinc-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none placeholder:text-zinc-700 leading-relaxed"

interface SectionDef {
  key: keyof QuarterData
  label: string
  emoji: string
  borderColor: string
  iconColor: string
}

const sectionDefs: SectionDef[] = [
  {
    key: "wins",
    label: "Kazanımlar",
    emoji: "✅",
    borderColor: "border-l-emerald-500",
    iconColor: "text-emerald-400",
  },
  {
    key: "bottlenecks",
    label: "Darboğazlar",
    emoji: "🚧",
    borderColor: "border-l-amber-500",
    iconColor: "text-amber-400",
  },
  {
    key: "opportunities",
    label: "Fırsatlar",
    emoji: "💡",
    borderColor: "border-l-violet-500",
    iconColor: "text-violet-400",
  },
  {
    key: "next_focus",
    label: "Sonraki Odak",
    emoji: "🎯",
    borderColor: "border-l-blue-500",
    iconColor: "text-blue-400",
  },
]

export default function QuarterReviewPage() {
  const [activeQ, setActiveQ] = useState<number>(1)
  const [data, setData] = useState<Record<number, QuarterData>>(buildInitialData)
  const [saving, setSaving] = useState(false)
  const [savedQ, setSavedQ] = useState<number | null>(null)

  const handleChange = (
    quarter: number,
    field: keyof QuarterData,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      [quarter]: { ...prev[quarter], [field]: value },
    }))
    setSavedQ(null)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setSaving(false)
    setSavedQ(activeQ)
  }

  const currentData = data[activeQ]

  return (
    <main className="flex-1 overflow-y-auto bg-[#0A0A0A]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#1A1A1A] px-6 py-4 lg:pl-6 pl-14">
        <h1 className="text-lg font-semibold text-zinc-100">Quarter Review</h1>
        <p className="text-xs text-zinc-600 mt-0.5">
          2024 çeyrek değerlendirmeleri
        </p>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Quarter Tabs */}
        <div className="flex gap-2 p-1 bg-[#111111] border border-[#222222] rounded-xl w-fit">
          {[1, 2, 3, 4].map((q) => (
            <button
              key={q}
              onClick={() => {
                setActiveQ(q)
                setSavedQ(null)
              }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeQ === q
                  ? "bg-violet-500 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-[#161616]"
              }`}
            >
              Q{q}
            </button>
          ))}
        </div>

        {/* Quarter Header */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Q{activeQ} {YEAR}
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                {QUARTER_MONTHS[activeQ]}
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-medium bg-[#1A1A1A] text-zinc-400 rounded-full border border-[#2A2A2A]">
              {YEAR} · Çeyrek {activeQ}
            </span>
          </div>
        </div>

        {/* 2x2 grid of sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionDefs.map((section) => (
            <div
              key={section.key}
              className={`bg-[#111111] border border-[#222222] border-l-4 ${section.borderColor} rounded-xl p-5 flex flex-col gap-3`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{section.emoji}</span>
                <h3 className={`text-sm font-semibold ${section.iconColor}`}>
                  {section.label}
                </h3>
              </div>
              <textarea
                rows={7}
                value={currentData[section.key]}
                onChange={(e) =>
                  handleChange(activeQ, section.key, e.target.value)
                }
                placeholder={`${section.label} için notlarınızı girin...`}
                className={textareaClass}
              />
            </div>
          ))}
        </div>

        {/* Success banner */}
        {savedQ === activeQ && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300 font-medium">
              Q{activeQ} {YEAR} verileri başarıyla kaydedildi.
            </p>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </main>
  )
}
