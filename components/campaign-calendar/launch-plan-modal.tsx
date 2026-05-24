"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { createCampaignLaunchPlan } from "@/actions/campaign";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CAMPAIGN_CALENDAR_CHANNELS } from "@/lib/validations/campaign";
import type { ActionState } from "@/types";

interface LaunchPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LaunchDuration = 7 | 14;

interface LaunchCardDraft {
  day: number;
  title: string;
  offer: string;
  notes: string;
  expected_revenue: string;
}

const initialState: ActionState = { status: "idle" };

const sevenDayTemplate: LaunchCardDraft[] = [
  {
    day: 1,
    title: "Problem farkındalığı",
    offer: "Ana problemi görünür yapan içerik ve sohbet açılışı",
    notes: "Hedef kitlenin yaşadığı problemi netleştir. Satış baskısı kurmadan bağlam aç.",
    expected_revenue: "",
  },
  {
    day: 2,
    title: "Maliyet ve kayıp",
    offer: "Mevcut durumun zaman, para ve fırsat maliyetini göster",
    notes: "Sorunu ertelemenin bedelini somutlaştır. Örnek senaryo veya mini hesap kullan.",
    expected_revenue: "",
  },
  {
    day: 3,
    title: "Yeni mekanizma",
    offer: "Çözüm yaklaşımını ve farklı bakış açısını anlat",
    notes: "Neden bu teklifin klasik çözümlerden farklı çalıştığını sade anlat.",
    expected_revenue: "",
  },
  {
    day: 4,
    title: "Kanıt ve güven",
    offer: "Sonuç, referans, ekran görüntüsü veya vaka üzerinden güven inşa et",
    notes: "Somut kazanımları göster. İtirazları azaltacak sosyal kanıt ekle.",
    expected_revenue: "",
  },
  {
    day: 5,
    title: "Teklif açıklığı",
    offer: "Paket, kapsam, bonus ve fiyat çerçevesini netleştir",
    notes: "Neyi alacaklarını, neden şimdi almaları gerektiğini ve sonraki adımı açık yaz.",
    expected_revenue: "",
  },
  {
    day: 6,
    title: "İtiraz kırma",
    offer: "Fiyat, zaman, güven veya uygunluk itirazlarını cevapla",
    notes: "En çok gelen 2-3 itirazı seç ve her birine kısa, net cevap ver.",
    expected_revenue: "",
  },
  {
    day: 7,
    title: "Son çağrı",
    offer: "Deadline, kontenjan veya kapanış çağrısı",
    notes: "Net CTA ver. Kimler için doğru, kimler için doğru değil ayrımını yap.",
    expected_revenue: "",
  },
];

const fourteenDayExtra: LaunchCardDraft[] = [
  {
    day: 8,
    title: "Segment bazlı teklif",
    offer: "Farklı müşteri segmentlerine ayrı kullanım senaryosu",
    notes: "Mevcut müşteri, sıcak lead ve kararsız kitle için farklı açıları ayır.",
    expected_revenue: "",
  },
  {
    day: 9,
    title: "Demo veya walkthrough",
    offer: "Ürünü/sonucu adım adım gösteren içerik",
    notes: "Platform, hizmet veya sürecin nasıl çalıştığını pratik şekilde göster.",
    expected_revenue: "",
  },
  {
    day: 10,
    title: "Bonus veya garanti",
    offer: "Risk azaltıcı bonus, garanti veya hızlı başlangıç desteği",
    notes: "Satın alma kararını kolaylaştıran destek katmanını ekle.",
    expected_revenue: "",
  },
  {
    day: 11,
    title: "Karşılaştırma",
    offer: "Alternatif çözümlerle maliyet/fayda karşılaştırması",
    notes: "Kendi teklifini doğrudan değil, karar kriterleri üzerinden güçlü göster.",
    expected_revenue: "",
  },
  {
    day: 12,
    title: "Sık sorulan sorular",
    offer: "FAQ, DM cevapları ve karar netleştirme",
    notes: "En çok gelen soruları tek yerde cevapla. Belirsizlikleri azalt.",
    expected_revenue: "",
  },
  {
    day: 13,
    title: "Kapanış hikayesi",
    offer: "Neden şimdi, neden bu teklif, neden bu hedef kitle",
    notes: "Duygusal ve stratejik kapanış. Satın almayanın neyi kaçıracağını netleştir.",
    expected_revenue: "",
  },
  {
    day: 14,
    title: "Final deadline",
    offer: "Son gün kapanış mesajı ve direkt satış çağrısı",
    notes: "Kısa, net, doğrudan. Link/DM/ödeme adımını tek CTA olarak ver.",
    expected_revenue: "",
  },
];

function buildTemplate(duration: LaunchDuration): LaunchCardDraft[] {
  const template =
    duration === 7 ? sevenDayTemplate : [...sevenDayTemplate, ...fourteenDayExtra];
  return template.map((item) => ({ ...item }));
}

function addDays(date: string, days: number): string {
  if (!date) return "";
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPreviewDate(date: string): string {
  if (!date) return "Tarih seçilmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function LaunchPlanModal({ open, onOpenChange }: LaunchPlanModalProps) {
  const [duration, setDuration] = useState<LaunchDuration>(7);
  const [launchName, setLaunchName] = useState("Yeni lansman");
  const [targetSegment, setTargetSegment] = useState("Mevcut müşteriler ve sıcak leadler");
  const [channel, setChannel] = useState("Internal Upsell");
  const [startDate, setStartDate] = useState("");
  const [cards, setCards] = useState<LaunchCardDraft[]>(() => buildTemplate(7));

  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await createCampaignLaunchPlan(prevState, formData);
      if (result.status === "success") onOpenChange(false);
      return result;
    },
    initialState
  );

  const payload = useMemo(() => JSON.stringify(cards), [cards]);

  const setCard = (
    day: number,
    key: keyof Omit<LaunchCardDraft, "day">,
    value: string
  ) => {
    setCards((current) =>
      current.map((card) => (card.day === day ? { ...card, [key]: value } : card))
    );
  };

  const handleDurationChange = (value: string) => {
    const nextDuration = Number(value) === 14 ? 14 : 7;
    setDuration(nextDuration);
    setCards((current) => {
      const template = buildTemplate(nextDuration);
      return template.map((templateCard) => {
        const existing = current.find((card) => card.day === templateCard.day);
        return existing ?? templateCard;
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Lansman Planı Oluştur</DialogTitle>
          <DialogDescription>
            7 veya 14 günlük lansman akışını gün gün taslak kartlara çevir.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5 px-6 pb-6">
          {state.status === "error" && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive">
                {state.error ?? "Lansman planı oluşturulamadı."}
              </p>
            </div>
          )}

          <input type="hidden" name="items" value={payload} />

          <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="launch_name">Lansman Adı</Label>
              <Input
                id="launch_name"
                name="launch_name"
                value={launchName}
                onChange={(event) => setLaunchName(event.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration">Lansman Stili</Label>
              <Select
                id="duration"
                name="duration"
                value={String(duration)}
                onChange={(event) => handleDurationChange(event.target.value)}
                disabled={isPending}
              >
                <option value="7">7 gün</option>
                <option value="14">14 gün</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="start_date">Başlangıç</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_0.7fr]">
            <div className="space-y-1.5">
              <Label htmlFor="target_segment">Hedef Kitle</Label>
              <Input
                id="target_segment"
                name="target_segment"
                value={targetSegment}
                onChange={(event) => setTargetSegment(event.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="channel">Ana Kanal</Label>
              <Select
                id="channel"
                name="channel"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                disabled={isPending}
              >
                {CAMPAIGN_CALENDAR_CHANNELS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Günlük Kartlar
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Her günün teklif açısını kaydetmeden önce düzenleyebilirsin.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {cards.map((card) => {
                const date = addDays(startDate, card.day - 1);

                return (
                  <div
                    key={card.day}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Gün {card.day}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatPreviewDate(date)}
                        </p>
                      </div>
                      <Input
                        aria-label={`Gün ${card.day} beklenen gelir`}
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Gelir"
                        value={card.expected_revenue}
                        onChange={(event) =>
                          setCard(card.day, "expected_revenue", event.target.value)
                        }
                        disabled={isPending}
                        className="h-9 w-28"
                      />
                    </div>

                    <div className="space-y-2">
                      <Input
                        aria-label={`Gün ${card.day} başlık`}
                        value={card.title}
                        onChange={(event) =>
                          setCard(card.day, "title", event.target.value)
                        }
                        disabled={isPending}
                      />
                      <Input
                        aria-label={`Gün ${card.day} teklif`}
                        value={card.offer}
                        onChange={(event) =>
                          setCard(card.day, "offer", event.target.value)
                        }
                        disabled={isPending}
                      />
                      <Textarea
                        aria-label={`Gün ${card.day} not`}
                        value={card.notes}
                        onChange={(event) =>
                          setCard(card.day, "notes", event.target.value)
                        }
                        disabled={isPending}
                        className="h-20 resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <CalendarPlus />
                {duration} Günlük Planı Takvime Ekle
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
