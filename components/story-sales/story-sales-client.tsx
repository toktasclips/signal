"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { createStorySalesPlan, deleteStorySalesItems } from "@/actions/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ActionState, CampaignCalendarItem } from "@/types";

type StoryStep = 1 | 2 | 3 | 4;

interface StorySalesClientProps {
  storyItems: CampaignCalendarItem[];
}

interface StoryCardDraft {
  day: number;
  title: string;
  text: string;
  notes: string;
  expected_revenue: string;
}

const initialState: ActionState = { status: "idle" };

const holisticStoryTemplate = {
  name: "Holistik Story Kurgusu",
  description:
    "Haftanın her günü farklı bir psikolojik tetikleyiciyi çalıştıran 7 günlük satış sekansı.",
  target: "Story izleyen sıcak takipçiler ve potansiyel müşteriler",
  cards: [
    {
      title: "Kanıt",
      text: "Birçok müşteriden gelen sonuçları göster. MÜŞTERİ1, MÜŞTERİ2 ve MÜŞTERİ3 için [X sonuç] + [eşsiz mekanizma] anlat. Sonra bunun şans değil tekrar edilebilir sistem olduğunu bağla. CTA: \"SONUÇLAR\".",
    },
    {
      title: "Netlik",
      text: "Program hakkında açıklık ver. İnsanların sorduğu soruları cevapla: program ne yapar, kimler için, nasıl ilerler, neden bu yöntemi seçmeli, ne beklemeli? CTA: \"PROGRAM\".",
    },
    {
      title: "İtiraz",
      text: "Büyük itirazı veya sınırlayıcı inancı kır. Hook ile başla, itiraz yaşayan karakteri tanıt, ek zorluğu göster, buna rağmen sürece girip sonuç aldığını kanıtla. CTA: \"NET\".",
    },
    {
      title: "Farklılaşma",
      text: "Eğitimsel yaklaşım kullan. Problemin gerçek nedenini öğret, bunu nereden bildiğini kanıtla, 3-4 problemi sırala, acıyı derinleştir, kendi modelini tanıt ve kanıtla. CTA: \"MODEL\".",
    },
    {
      title: "Kişisel Bağ",
      text: "Daha hafif ve insani bir sekans paylaş. Günlük bir an, kişisel hikaye, değer veya perde arkası üzerinden bağ kur. Amaç satış baskısı değil, gerçek insan hissi.",
    },
    {
      title: "Engel Kaldırma",
      text: "Müşteri sonuçlarıyla katılma engelini kaldır. Müşteriyi tanıt, başlangıç problemini anlat, itirazını göster, nasıl karar verdiğini ve hangi sonucu aldığını kanıtla. CTA: \"BAŞLA\".",
    },
    {
      title: "Misyon",
      text: "Misyonu anlat: eğitim-koçluk işinin satın alınan değil hazır olunduğunda başlanan bir iş olduğunu göstermek; keyif alınan insanlarla, strese boğulmadan, kaliteli müşterilerle büyümek. Bitir: uygula, sonucu gör, düzelt.",
    },
  ],
};

function addDays(date: string, days: number): string {
  if (!date) return "";
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string): string {
  if (!date) return "Tarih seçilmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    weekday: "long",
  }).format(new Date(`${date}T00:00:00`));
}

function extractStoryName(item: CampaignCalendarItem): string {
  const match = item.notes?.match(/Hikayeden Satış:\s*(.+)/);
  return match?.[1]?.split("\n")[0]?.trim() || "Hikayeden Satış";
}

function groupStoryItems(items: CampaignCalendarItem[]) {
  const groups = new Map<string, CampaignCalendarItem[]>();
  items.forEach((item) => {
    const name = extractStoryName(item);
    groups.set(name, [...(groups.get(name) ?? []), item]);
  });
  return Array.from(groups.entries()).map(([name, groupItems]) => ({
    name,
    items: groupItems.sort(
      (a, b) =>
        new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()
    ),
  }));
}

function buildCards(): StoryCardDraft[] {
  return holisticStoryTemplate.cards.map((card, index) => ({
    day: index + 1,
    title: card.title,
    text: card.text,
    notes: `${holisticStoryTemplate.name} story sekansı. Görsel notu, sticker ve DM takip fikrini burada detaylandır.`,
    expected_revenue: "",
  }));
}

export function StorySalesClient({ storyItems }: StorySalesClientProps) {
  const [step, setStep] = useState<StoryStep>(1);
  const [storyName, setStoryName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetSegment, setTargetSegment] = useState(holisticStoryTemplate.target);
  const [cards, setCards] = useState<StoryCardDraft[]>(() => buildCards());

  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await createStorySalesPlan(prevState, formData);
      return result;
    },
    initialState
  );

  const groups = useMemo(() => groupStoryItems(storyItems), [storyItems]);
  const payload = useMemo(
    () =>
      JSON.stringify(
        cards.map((card) => ({
          day: card.day,
          title: card.title,
          offer: card.text,
          notes: card.notes,
          expected_revenue: card.expected_revenue,
        }))
      ),
    [cards]
  );

  const canContinue =
    (step === 1 && storyName.trim().length > 0) ||
    step === 2 ||
    (step === 3 && startDate.length > 0) ||
    step === 4;

  const next = () => {
    if (!canContinue || step === 4) return;
    setStep((current) => Math.min(4, current + 1) as StoryStep);
  };

  const back = () => setStep((current) => Math.max(1, current - 1) as StoryStep);

  const updateCard = (
    day: number,
    key: keyof Omit<StoryCardDraft, "day">,
    value: string
  ) => {
    setCards((current) =>
      current.map((card) => (card.day === day ? { ...card, [key]: value } : card))
    );
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8">
              <MessageSquareText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Yeni Story Akışı Hazırla
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Holistik story kurgusunu seç, 7 günlük akışı düzenle ve her kartı
              ayrı çalışma sayfasında detaylandır.
            </p>
          </div>
          <div className="hidden gap-1 sm:flex">
            {[1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className={cn(
                  "h-1.5 w-8 rounded-full",
                  item <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        <form
          action={formAction}
          className="space-y-5"
          onSubmit={(event) => {
            if (step < 4) {
              event.preventDefault();
              next();
            }
          }}
        >
          <input type="hidden" name="story_name" value={storyName} />
          <input type="hidden" name="duration" value={cards.length} />
          <input type="hidden" name="start_date" value={startDate} />
          <input type="hidden" name="target_segment" value={targetSegment} />
          <input type="hidden" name="items" value={payload} />

          {step === 4 && state.status === "error" && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive">
                {state.error ?? "Story akışı oluşturulamadı."}
              </p>
            </div>
          )}

          {state.status === "success" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-medium text-emerald-700">
                Story akışı eklendi. Kartlara tıklayıp metinleri büyütebilirsin.
              </p>
            </div>
          )}

          {step === 1 && (
            <StepPanel
              label="1. Adım"
              title="Story akışının ismi ne?"
              description="Bu isim kaydedilen story sekansını gruplar."
            >
              <div className="max-w-xl space-y-1.5">
                <Label htmlFor="story-name">Akış İsmi</Label>
                <Input
                  id="story-name"
                  value={storyName}
                  onChange={(event) => setStoryName(event.target.value)}
                  placeholder="Örn. Kulucka-30 Upsell Storyleri"
                />
              </div>
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel
              label="2. Adım"
              title="Story sekansı"
              description="Bu alanda tek ana akış kullanılıyor; hafta boyunca farklı psikolojik tetikleyiciler sırayla çalışır."
            >
              <div className="rounded-xl border border-primary/30 bg-primary/8 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {holisticStoryTemplate.name}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {holisticStoryTemplate.description}
                    </p>
                  </div>
                  <Check className="mt-1 h-4 w-4 text-primary" />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {holisticStoryTemplate.cards.map((card, index) => (
                    <div
                      key={card.title}
                      className="rounded-lg border border-border/70 bg-background/70 px-3 py-2"
                    >
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Gün {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {card.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel
              label="3. Adım"
              title="Ne zaman başlasın?"
              description="Story kartları seçtiğin tarihten itibaren sırayla planlanır."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="start-date">Başlangıç Günü</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="target-segment">Kitle</Label>
                  <Input
                    id="target-segment"
                    value={targetSegment}
                    onChange={(event) => setTargetSegment(event.target.value)}
                  />
                </div>
              </div>
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel
              label="4. Adım"
              title={`${holisticStoryTemplate.name} kartlarını kontrol et`}
              description="Her story kartının başlığını ve ekranda görünecek ana metnini burada düzenle."
            >
              <div className="grid gap-3 lg:grid-cols-3">
                {cards.map((card) => {
                  const date = addDays(startDate, card.day - 1);
                  return (
                    <div
                      key={card.day}
                      className="rounded-xl border border-border bg-background p-3 shadow-sm"
                    >
                      <div className="mb-3">
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                          Story {card.day}
                        </p>
                        <p className="mt-1 text-xs font-medium text-foreground">
                          {formatDate(date)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={card.title}
                          onChange={(event) =>
                            updateCard(card.day, "title", event.target.value)
                          }
                          aria-label={`Story ${card.day} başlık`}
                        />
                        <Textarea
                          value={card.text}
                          onChange={(event) =>
                            updateCard(card.day, "text", event.target.value)
                          }
                          aria-label={`Story ${card.day} metin`}
                          className="h-28 resize-none"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={card.expected_revenue}
                          onChange={(event) =>
                            updateCard(
                              card.day,
                              "expected_revenue",
                              event.target.value
                            )
                          }
                          placeholder="Beklenen gelir"
                          aria-label={`Story ${card.day} beklenen gelir`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </StepPanel>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
              Geri
            </Button>

            {step < 4 ? (
              <Button type="button" onClick={next} disabled={!canContinue || isPending}>
                Devam
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Akışı Kaydet
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Story Akışları
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kaydedilen hikayeden satış sekanslarını buradan açıp detaylandır.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">
              Henüz story akışı yok
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.name}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {group.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {group.items.length} story kartı
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/story-sales/${group.items[0]?.id ?? ""}`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Kartları düzenle
                      </Link>
                    </Button>
                    <form
                      action={deleteStorySalesItems}
                      onSubmit={(event) => {
                        if (!confirm(`"${group.name}" story akışı silinsin mi?`)) {
                          event.preventDefault();
                        }
                      }}
                    >
                      {group.items.map((item) => (
                        <input
                          key={item.id}
                          type="hidden"
                          name="item_id"
                          value={item.id}
                        />
                      ))}
                      <Button type="submit" variant="outline" size="sm">
                        <Trash2 className="h-3.5 w-3.5" />
                        Sil
                      </Button>
                    </form>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item, index) => (
                    <Link
                      key={item.id}
                      href={`/story-sales/${item.id}`}
                      className="rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/30"
                    >
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Story {index + 1} · {formatDate(item.planned_date)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {item.title.split(": ").pop()}
                      </p>
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                        {item.offer}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepPanel({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {label}
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
