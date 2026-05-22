import type { LeadStatus, LeadTemperature, LeadPriority } from "@/types";

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

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_CLASSES: Record<LeadPriority, string> = {
  low: "bg-muted text-muted-foreground border-transparent",
  medium: "bg-zinc-50 text-zinc-600 border-transparent",
  high: "bg-amber-50 text-amber-700 border-transparent",
  urgent: "bg-red-50 text-red-600 border-transparent",
};

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === new Date().toISOString().split("T")[0];
}

export function formatFollowUpDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr < today) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (dateStr === yesterday) return "Yesterday";
    return `${days}d overdue`;
  }
  const days = Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000) + 1;
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(dateStr));
}

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
