"use client"

import { useState } from "react"
import { mockQuarterReviews } from "@/lib/analytics/mock-data"
import { CheckCircle, Loader2 } from "lucide-react"

const QUARTER_MONTHS: Record<number, string> = {
  1: "Ocak, Şubat, Mart",
  2: "Nisan, Mayıs, Haziran",
  3: "Temmuz, Ağustos, Eylül",
  4: "Ekim, Kasım, Aralık",
}
const YEAR = 2024

interface QuarterData { wins: string; bottlenecks: string; opportunities: string; next_focus: string }

function buildInitialData(): Record<number, QuarterData> {
  const result: Record<number, QuarterData> = {}
  for (let q = 1; q <= 4; q++) {
    const found = mockQuarterReviews.find((r) => r.quarter === q && r.year === YEAR)
    result[q] = { wins: found?.wins ?? "", bottlenecks: found?.bottlenecks ?? "", opportunities: found?.opportunities ?? "", next_focus: found?.next_focus ?? "" }
  }
  return result
}

const textareaClass = "w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"

const sectionDefs = [
  { key: "wins" as keyof QuarterData, label: "Kazanımlar", accent: "border-emerald-200/80 bg-emerald-50/25", iconColor: "text-emerald-700" },
  { key: "bottlenecks" as keyof QuarterData, label: "Darboğazlar", accent: "border-amber-200/80 bg-amber-50/25", iconColor: "text-amber-700" },
  { key: "opportunities" as keyof QuarterData, label: "Fırsatlar", accent: "border-border bg-card", iconColor: "text-primary" },
  { key: "next_focus" as keyof QuarterData, label: "Sonraki Odak", accent: "border-border bg-card", iconColor: "text-muted-foreground" },
]

export default function QuarterReviewPage() {
  const [activeQ, setActiveQ] = useState<number>(1)
  const [data, setData] = useState<Record<number, QuarterData>>(buildInitialData)
  const [saving, setSaving] = useState(false)
  const [savedQ, setSavedQ] = useState<number | null>(null)

  const handleChange = (quarter: number, field: keyof QuarterData, value: string) => {
    setData((prev) => ({ ...prev, [quarter]: { ...prev[quarter], [field]: value } }))
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
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-background/95 px-6 py-6 backdrop-blur lg:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quarter Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">2024 çeyrek değerlendirmeleri</p>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="flex w-fit gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
          {[1, 2, 3, 4].map((q) => (
            <button key={q} onClick={() => { setActiveQ(q); setSavedQ(null) }} className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${activeQ === q ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
              Q{q}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Q{activeQ} {YEAR}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{QUARTER_MONTHS[activeQ]}</p>
            </div>
            <span className="rounded-md border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">{YEAR} · Çeyrek {activeQ}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionDefs.map((section) => (
            <div key={section.key} className={`flex flex-col gap-3 rounded-xl border ${section.accent} p-5 shadow-card`}>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-semibold ${section.iconColor}`}>{section.label}</h3>
              </div>
              <textarea rows={7} value={currentData[section.key]} onChange={(e) => handleChange(activeQ, section.key, e.target.value)} placeholder={`${section.label} için notlarınızı girin...`} className={textareaClass} />
            </div>
          ))}
        </div>

        {savedQ === activeQ && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3">
            <CheckCircle size={16} className="flex-shrink-0 text-emerald-700" />
            <p className="text-sm font-medium text-emerald-700">Q{activeQ} {YEAR} verileri başarıyla kaydedildi.</p>
          </div>
        )}

        <div className="flex justify-end pb-8">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  )
}
