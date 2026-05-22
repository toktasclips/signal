import type { LeadStatus, LeadTemperature } from "@/types";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  offer_sent: "Offer Sent",
  won: "Won",
  lost: "Lost",
};

export const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  cold: "Cold",
  warm: "Warm",
  hot: "Hot",
  ready: "Ready",
};

export const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: "bg-muted text-muted-foreground border-transparent",
  contacted: "bg-blue-50 text-blue-700 border-transparent",
  qualified: "bg-violet-50 text-violet-700 border-transparent",
  offer_sent: "bg-amber-50 text-amber-700 border-transparent",
  won: "bg-emerald-50 text-emerald-700 border-transparent",
  lost: "bg-red-50 text-red-600 border-transparent",
};

export const TEMPERATURE_CLASSES: Record<LeadTemperature, string> = {
  cold: "bg-sky-50 text-sky-700 border-transparent",
  warm: "bg-orange-50 text-orange-700 border-transparent",
  hot: "bg-red-50 text-red-600 border-transparent",
  ready: "bg-emerald-50 text-emerald-700 border-transparent",
};

export function formatValue(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
