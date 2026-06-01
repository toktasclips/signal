"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutList,
  Pencil,
  Plus,
  Rocket,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { deleteCampaignCalendarItem } from "@/actions/campaign";
import { Button } from "@/components/ui/button";
import { CampaignCalendarModal } from "./campaign-calendar-modal";
import { cn } from "@/lib/utils";
import type {
  CampaignCalendarItem,
  CampaignCalendarStatus,
} from "@/types";

interface CampaignCalendarClientProps {
  items: CampaignCalendarItem[];
}

type ViewFilter = "active" | "all" | CampaignCalendarStatus;
type DisplayMode = "list" | "calendar";

const STATUS_LABELS: Record<CampaignCalendarStatus, string> = {
  planned: "Planlandı",
  in_progress: "Hazırlanıyor",
  sent: "Gönderildi",
  won: "Kazandı",
  lost: "Kaybetti",
  paused: "Beklemede",
};

const STATUS_STYLES: Record<CampaignCalendarStatus, string> = {
  planned: "border-zinc-200 bg-zinc-50 text-zinc-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  sent: "border-amber-200 bg-amber-50 text-amber-700",
  won: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lost: "border-red-200 bg-red-50 text-red-700",
  paused: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

const FILTERS: Array<{ label: string; value: ViewFilter }> = [
  { label: "Aktif", value: "active" },
  { label: "Tümü", value: "all" },
  { label: "Planlandı", value: "planned" },
  { label: "Gönderildi", value: "sent" },
  { label: "Kazandı", value: "won" },
];

function formatCurrency(value: number | null): string {
  if (!value) return "—";
  return `₺${value.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function daysUntil(value: string): number {
  const today = new Date(new Date().toDateString()).getTime();
  const target = new Date(`${value}T00:00:00`).getTime();
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(key: string, amount: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return monthKey(date);
}

function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function buildMonthDays(key: string): Date[] {
  const [year, month] = key.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function dateTone(item: CampaignCalendarItem): string {
  if (["won", "lost", "paused"].includes(item.status)) return "text-muted-foreground";
  const diff = daysUntil(item.planned_date);
  if (diff < 0) return "text-red-600";
  if (diff <= 7) return "text-amber-700";
  return "text-muted-foreground";
}

export function CampaignCalendarClient({ items }: CampaignCalendarClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CampaignCalendarItem | null>(null);
  const [filter, setFilter] = useState<ViewFilter>("active");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [visibleMonth, setVisibleMonth] = useState(() => monthKey(new Date()));
  const [isPending, startTransition] = useTransition();

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()
      ),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") return sortedItems;
    if (filter === "active") {
      return sortedItems.filter((item) =>
        ["planned", "in_progress", "sent"].includes(item.status)
      );
    }
    return sortedItems.filter((item) => item.status === filter);
  }, [filter, sortedItems]);

  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CampaignCalendarItem[]>();
    filteredItems.forEach((item) => {
      const current = map.get(item.planned_date) ?? [];
      map.set(item.planned_date, [...current, item]);
    });
    return map;
  }, [filteredItems]);

  const openItems = items.filter((item) =>
    ["planned", "in_progress", "sent"].includes(item.status)
  );
  const expectedRevenue = openItems.reduce(
    (sum, item) => sum + (item.expected_revenue ?? 0),
    0
  );
  const wonRevenue = items
    .filter((item) => item.status === "won")
    .reduce((sum, item) => sum + (item.expected_revenue ?? 0), 0);
  const nextItem = openItems
    .slice()
    .sort(
      (a, b) =>
        new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()
    )[0];

  const handleCreate = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: CampaignCalendarItem) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      void deleteCampaignCalendarItem(id);
    });
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          label="Aktif Hamle"
          value={String(openItems.length)}
          icon={<Target className="h-3.5 w-3.5 text-primary" />}
        />
        <MetricCard
          label="Beklenen Gelir"
          value={formatCurrency(expectedRevenue)}
          icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
        />
        <MetricCard
          label="Kazanılan"
          value={formatCurrency(wonRevenue)}
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
        />
        <MetricCard
          label="Sıradaki"
          value={nextItem ? formatDate(nextItem.planned_date) : "—"}
          icon={<Clock3 className="h-3.5 w-3.5 text-amber-700" />}
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === item.value
                  ? "border-primary/20 bg-primary/8 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setDisplayMode("list")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                displayMode === "list"
                  ? "bg-primary/8 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("calendar")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                displayMode === "calendar"
                  ? "bg-primary/8 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Takvim
            </button>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/launch-plans">
              <Rocket className="h-4 w-4" />
              Lansman Planları
            </Link>
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Yeni Hamle
          </Button>
        </div>
      </div>

      {displayMode === "calendar" && (
        <CampaignMonthCalendar
          itemsByDate={itemsByDate}
          monthDays={monthDays}
          visibleMonth={visibleMonth}
          onMonthChange={setVisibleMonth}
          onEdit={handleEdit}
        />
      )}

      {displayMode === "list" && (
        <>
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-5 py-16 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="mb-1 text-sm font-semibold text-foreground">
                Takvimde kampanya hamlesi yok
              </p>
              <p className="mx-auto mb-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Upsell, abonelik teklifi veya takip kampanyalarını buraya ekleyip
                gelir planını takvim üstünden yönetebilirsin.
              </p>
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                İlk Hamleyi Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <CalendarItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  disabled={isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CampaignCalendarModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditItem(null);
        }}
        item={editItem}
      />

    </>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function CampaignMonthCalendar({
  itemsByDate,
  monthDays,
  visibleMonth,
  onMonthChange,
  onEdit,
}: {
  itemsByDate: Map<string, CampaignCalendarItem[]>;
  monthDays: Date[];
  visibleMonth: string;
  onMonthChange: (month: string | ((current: string) => string)) => void;
  onEdit: (item: CampaignCalendarItem) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {formatMonth(visibleMonth)}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Planlanan hamleleri ay görünümünde kontrol et.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMonthChange((current) => shiftMonth(current, -1))}
          >
            Önceki
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMonthChange(monthKey(new Date()))}
          >
            Bu Ay
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMonthChange((current) => shiftMonth(current, 1))}
          >
            Sonraki
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-l border-t border-border text-[11px] font-semibold uppercase text-muted-foreground">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
          <div key={day} className="border-b border-r border-border px-2 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-border">
        {monthDays.map((day) => {
          const key = toDateKey(day);
          const dayItems = itemsByDate.get(key) ?? [];
          const isCurrentMonth = key.startsWith(visibleMonth);

          return (
            <div
              key={key}
              className={cn(
                "min-h-28 border-b border-r border-border p-2",
                isCurrentMonth ? "bg-card" : "bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "mb-2 text-xs font-semibold tabular-nums",
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onEdit(item)}
                    className="block w-full rounded-md border border-border bg-background px-2 py-1 text-left text-[11px] leading-snug text-foreground shadow-sm transition-colors hover:border-primary/30"
                  >
                    <span className="line-clamp-2">{item.title}</span>
                  </button>
                ))}
                {dayItems.length > 3 && (
                  <p className="px-1 text-[11px] text-muted-foreground">
                    +{dayItems.length - 3} hamle
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarItemCard({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: CampaignCalendarItem;
  onEdit: (item: CampaignCalendarItem) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const diff = daysUntil(item.planned_date);
  const timing =
    diff < 0 ? `${Math.abs(diff)} gün gecikti` : diff === 0 ? "Bugün" : `${diff} gün kaldı`;

  return (
    <article className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                STATUS_STYLES[item.status]
              )}
            >
              {STATUS_LABELS[item.status]}
            </span>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {item.channel}
            </span>
            <span className={cn("text-xs font-medium", dateTone(item))}>
              {timing}
            </span>
          </div>

          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {item.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.target_segment} için {item.offer}
          </p>

          {item.notes && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.notes}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-6 lg:text-right">
          <div>
            <p className="text-xs text-muted-foreground">Tarih</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(item.planned_date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Potansiyel</p>
            <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
              {formatCurrency(item.expected_revenue)}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onEdit(item)}
              aria-label="Düzenle"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onDelete(item.id)}
              disabled={disabled}
              aria-label="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
