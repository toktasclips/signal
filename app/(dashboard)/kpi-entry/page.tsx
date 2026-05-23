"use client"

import { useState } from "react"
import { mockMetrics, TURKISH_MONTHS } from "@/lib/analytics/mock-data"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

interface FormState {
  month: number; year: number; total_goal: string; new_deal_value: string
  monthly_recurring_revenue: string; cash_collected: string; profit: string
  ad_spend: string; cpm: string; roas: string; instagram_reach: string
  instagram_impressions: string; new_customers: string; instagram_followers: string
  engagement: string; profile_visits: string; youtube_subscribers: string
  youtube_watch_hours: string; shares: string; email_list: string
  software_expenses: string; other_expenses: string; notes: string
}

const initialState: FormState = {
  month: new Date().getMonth() + 1, year: 2024, total_goal: "", new_deal_value: "",
  monthly_recurring_revenue: "", cash_collected: "", profit: "", ad_spend: "",
  cpm: "", roas: "", instagram_reach: "", instagram_impressions: "", new_customers: "",
  instagram_followers: "", engagement: "", profile_visits: "", youtube_subscribers: "",
  youtube_watch_hours: "", shares: "", email_list: "", software_expenses: "",
  other_expenses: "", notes: "",
}

const YEARS = [2022, 2023, 2024, 2025, 2026]
const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
const labelClass = "mb-1 block text-xs text-muted-foreground"

interface FieldConfig { key: keyof Omit<FormState, "month" | "year" | "notes">; label: string; step?: string; min?: string; placeholder?: string }
interface SectionConfig { title: string; color: string; fields: FieldConfig[] }

const sections: SectionConfig[] = [
  { title: "Finansal", color: "text-emerald-700", fields: [
    { key: "total_goal", label: "Hedef Gelir (₺)", step: "1000", min: "0", placeholder: "0" },
    { key: "new_deal_value", label: "Yeni Anlaşma Değeri (₺)", step: "1000", min: "0", placeholder: "0" },
    { key: "monthly_recurring_revenue", label: "MRR (₺)", step: "500", min: "0", placeholder: "0" },
    { key: "cash_collected", label: "Nakit Tahsilat (₺)", step: "1000", min: "0", placeholder: "0" },
    { key: "profit", label: "Kâr (₺)", step: "500", placeholder: "0" },
  ]},
  { title: "Reklam", color: "text-amber-700", fields: [
    { key: "ad_spend", label: "Reklam Harcaması (₺)", step: "100", min: "0", placeholder: "0" },
    { key: "cpm", label: "CPM (₺)", step: "0.1", min: "0", placeholder: "0.00" },
    { key: "roas", label: "ROAS (x)", step: "0.1", min: "0", placeholder: "0.0" },
  ]},
  { title: "Instagram", color: "text-primary", fields: [
    { key: "instagram_reach", label: "Reach", step: "100", min: "0", placeholder: "0" },
    { key: "instagram_impressions", label: "Gösterim", step: "100", min: "0", placeholder: "0" },
    { key: "new_customers", label: "Yeni Müşteri", step: "1", min: "0", placeholder: "0" },
    { key: "instagram_followers", label: "Takipçi", step: "10", min: "0", placeholder: "0" },
    { key: "engagement", label: "Etkileşim (%)", step: "0.1", min: "0", placeholder: "0.0" },
    { key: "profile_visits", label: "Profil Ziyareti", step: "10", min: "0", placeholder: "0" },
  ]},
  { title: "YouTube", color: "text-red-700", fields: [
    { key: "youtube_subscribers", label: "Abone", step: "10", min: "0", placeholder: "0" },
    { key: "youtube_watch_hours", label: "İzlenme Saati", step: "10", min: "0", placeholder: "0" },
  ]},
  { title: "Diğer", color: "text-muted-foreground", fields: [
    { key: "shares", label: "Paylaşım", step: "1", min: "0", placeholder: "0" },
    { key: "email_list", label: "E-posta Listesi", step: "10", min: "0", placeholder: "0" },
    { key: "software_expenses", label: "Yazılım Giderleri (₺)", step: "50", min: "0", placeholder: "0" },
    { key: "other_expenses", label: "Diğer Giderler (₺)", step: "50", min: "0", placeholder: "0" },
  ]},
]

export default function KpiEntryPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const existingEntry = mockMetrics.find((m) => m.month === form.month && m.year === form.year)

  const handleChange = (key: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setLoading(false)
    setSuccess(true)
  }

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-background/95 px-6 py-6 backdrop-blur lg:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">KPI Girişi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Aylık metriklerinizi buradan girin</p>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Dönem Seçimi</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Ay</label>
                <select value={form.month} onChange={(e) => handleChange("month", Number(e.target.value))} className={inputClass}>
                  {TURKISH_MONTHS.map((name, i) => (<option key={i + 1} value={i + 1}>{name}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Yıl</label>
                <select value={form.year} onChange={(e) => handleChange("year", Number(e.target.value))} className={inputClass}>
                  {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
            </div>
            {existingEntry && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5">
                <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-700" />
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Uyarı:</span> {TURKISH_MONTHS[form.month - 1]} {form.year} için mevcut bir kayıt var. Kaydetmeniz durumunda üzerine yazılacak.
                </p>
              </div>
            )}
          </div>

          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
                <h2 className={`text-sm font-semibold ${section.color}`}>{section.title}</h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <label className={labelClass}>{field.label}</label>
                    <input type="number" step={field.step ?? "1"} min={field.min} placeholder={field.placeholder ?? "0"} value={form[field.key]} onChange={(e) => handleChange(field.key, e.target.value)} className={inputClass} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
              <h2 className="text-sm font-semibold text-foreground">Notlar</h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div>
              <label className={labelClass}>Bu ay hakkında notlarınız</label>
              <textarea rows={4} placeholder="Önemli gelişmeler, kampanyalar, değerlendirmeler..." value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} className={`${inputClass} resize-none`} />
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3">
              <CheckCircle size={16} className="flex-shrink-0 text-emerald-700" />
              <p className="text-sm font-medium text-emerald-700">{TURKISH_MONTHS[form.month - 1]} {form.year} verileri başarıyla kaydedildi.</p>
            </div>
          )}

          <div className="flex justify-end pb-8">
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
