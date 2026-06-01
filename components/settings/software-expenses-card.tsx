"use client";

import { useActionState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createSoftwareExpense,
  deleteSoftwareExpense,
} from "@/actions/software-expenses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ActionState, SoftwareExpenseItem } from "@/types";

interface SoftwareExpensesCardProps {
  items: SoftwareExpenseItem[];
}

const initialState: ActionState = { status: "idle" };

function formatMoney(value: number, currency: string): string {
  const prefix = currency === "USD" ? "$" : currency === "TRY" ? "₺" : `${currency} `;
  return `${prefix}${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

export function SoftwareExpensesCard({ items }: SoftwareExpensesCardProps) {
  const [state, formAction, isPending] = useActionState(
    createSoftwareExpense,
    initialState
  );
  const [isDeleting, startTransition] = useTransition();

  const activeItems = items.filter((item) => item.is_active);
  const totals = activeItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.currency] = (acc[item.currency] ?? 0) + item.monthly_cost;
    return acc;
  }, {});

  const handleDelete = (id: string) => {
    startTransition(() => {
      void deleteSoftwareExpense(id);
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Aylık Yazılım Giderleri
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Abonelikleri ayrı takip et; KPI tarafındaki aylık yazılım gideriyle
            kontrol etmek kolay olsun.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(totals).length === 0 ? (
            <Badge variant="secondary">Kayıt yok</Badge>
          ) : (
            Object.entries(totals).map(([currency, total]) => (
              <Badge key={currency} variant="success">
                {formatMoney(total, currency)} / ay
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">
              Henüz yazılım gideri yok
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Manychat, Kit, ChatGPT gibi aylık abonelikleri buraya ekleyebilirsin.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm text-foreground">{item.name}</p>
                  {item.category && (
                    <Badge variant="secondary">{item.category}</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatMoney(item.monthly_cost, item.currency)} / ay
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(item.id)}
                disabled={isDeleting}
                aria-label="Yazılım giderini sil"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <form action={formAction} className="mt-5 grid gap-3 md:grid-cols-[1fr_120px_110px_1fr_auto] md:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="software-name">Araç</Label>
          <Input id="software-name" name="name" placeholder="Manychat" disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="software-cost">Tutar</Label>
          <Input
            id="software-cost"
            name="monthly_cost"
            type="number"
            min="0"
            step="0.01"
            placeholder="25"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="software-currency">Para</Label>
          <Select id="software-currency" name="currency" defaultValue="USD" disabled={isPending}>
            <option value="USD">USD</option>
            <option value="TRY">TRY</option>
            <option value="EUR">EUR</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="software-category">Kategori</Label>
          <Input
            id="software-category"
            name="category"
            placeholder="AI, Email, Community..."
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          <Plus className="h-4 w-4" />
          Ekle
        </Button>
      </form>

      {state.status === "error" && (
        <p className="mt-3 text-sm font-medium text-red-700">{state.error}</p>
      )}
    </section>
  );
}
