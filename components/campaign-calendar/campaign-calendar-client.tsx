"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { deleteCampaignCalendarItem } from "@/actions/campaign";
import { Button } from "@/components/ui/button";
import { CampaignCalendarModal } from "./campaign-calendar-modal";
import { LaunchPlanModal } from "./launch-plan-modal";
import { cn } from "@/lib/utils";
import type {
  CampaignCalendarItem,
  CampaignCalendarStatus,
} from "@/types";

interface CampaignCalendarClientProps {
  items: CampaignCalendarItem[];
}

type ViewFilter = "active" | "all" | CampaignCalendarStatus;

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

function dateTone(item: CampaignCalendarItem): string {
  if (["won", "lost", "paused"].includes(item.status)) return "text-muted-foreground";
  const diff = daysUntil(item.planned_date);
  if (diff < 0) return "text-red-600";
  if (diff <= 7) return "text-amber-700";
  return "text-muted-foreground";
}

export function CampaignCalendarClient({ items }: CampaignCalendarClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CampaignCalendarItem | null>(null);
  const [filter, setFilter] = useState<ViewFilter>("active");
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
          <Button size="sm" variant="outline" onClick={() => setLaunchModalOpen(true)}>
            <CalendarDays className="h-4 w-4" />
            Lansman Planı
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Yeni Hamle
          </Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="mb-1 text-sm font-semibold text-foreground">
            Takvimde kampanya hamlesi yok
          </p>
          <p className="mx-auto mb-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Upsell, lansman, abonelik teklifi veya takip kampanyalarını buraya
            ekleyip gelir planını takvim üstünden yönetebilirsin.
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

      <CampaignCalendarModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditItem(null);
        }}
        item={editItem}
      />

      <LaunchPlanModal
        open={launchModalOpen}
        onOpenChange={setLaunchModalOpen}
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
