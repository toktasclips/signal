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
  Plus,
} from "lucide-react";
import { createStorySalesPlan } from "@/actions/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ActionState, CampaignCalendarItem } from "@/types";

type StoryStep = 1 | 2 | 3 | 4;
type StoryTemplateId = "warm-offer" | "proof-stack" | "objection-breaker" | "dm-sprint";

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

const storyTemplates: Record<
  StoryTemplateId,
  {
    name: string;
    description: string;
    target: string;
    cards: Array<{ title: string; text: string }>;
  }
> = {
  "warm-offer": {
    name: "Sıcak Teklif Sekansı",
    description: "Kitleyi problemden teklife yumuşak geçirir.",
    target: "Sıcak takipçiler ve mevcut kitle",
    cards: [
      { title: "Bağlam", text: "Bugün şu problemi konuşalım: [ana problem]." },
      { title: "Ayna", text: "Eğer sen de [belirti] yaşıyorsan yalnız değilsin." },
      { title: "Mikro Kanıt", text: "[kanıt / sonuç / ekran görüntüsü] burada devreye giriyor." },
      { title: "Bakış Açısı", text: "Bence mesele [felsefe]. Bu yüzden çözüm şöyle kurulmalı." },
      { title: "Teklif", text: "[teklif] için bugün DM'den konuşabiliriz." },
      { title: "DM CTA", text: "İlgileniyorsan bana '[anahtar kelime]' yaz." },
      { title: "Takip", text: "Dün yazmayı düşünenler için kapıyı bugün de açık tutuyorum." },
    ],
  },
  "proof-stack": {
    name: "Kanıt Odaklı Satış",
    description: "Sonuç, referans ve vaka üzerinden güven kurar.",
    target: "Kararsız potansiyel müşteriler",
    cards: [
      { title: "Öncesi", text: "Başlangıç noktası şuydu: [önceki durum]." },
      { title: "Süreç", text: "Şunu değiştirdik: [yaklaşım / aksiyon]." },
      { title: "Sonuç", text: "Sonuç: [metrik / yorum / müşteri sonucu]." },
      { title: "Neden Çalıştı", text: "Çünkü [stratejik neden]." },
      { title: "Senin İçin", text: "Bunu kendi işine uyarlamak istersen [teklif]." },
      { title: "Takip", text: "Detay istiyorsan bana '[anahtar kelime]' yaz." },
      { title: "Son Hatırlatma", text: "Bu sonucu kendi sürecine taşımak isteyenlerle bugün konuşuyorum." },
    ],
  },
  "objection-breaker": {
    name: "İtiraz Kırma",
    description: "Fiyat, zaman, güven ve karar itirazlarını parçalar.",
    target: "DM'de bekleyen veya kararsız leadler",
    cards: [
      { title: "İtiraz", text: "'Şu an doğru zaman mı?' sorusunu açalım." },
      { title: "Maliyet", text: "Asıl maliyet çoğu zaman [devam eden problem]." },
      { title: "Yanlış Çözüm", text: "Sadece [yanlış yöntem] yapmak problemi çözmüyor." },
      { title: "Doğru Çerçeve", text: "Ben bunu şöyle ele alıyorum: [felsefe]." },
      { title: "Plan", text: "İlk adım [plan 1], sonra [plan 2]." },
      { title: "Çağrı", text: "Bunu birlikte netleştirelim; DM'den '[anahtar kelime]' yaz." },
      { title: "Kapanış", text: "Kararı ertelemek de bir karar; istersen bugün netleştirelim." },
    ],
  },
  "dm-sprint": {
    name: "DM Sprint",
    description: "Hızlı cevap, anket ve DM çağrısıyla lead üretir.",
    target: "Story etkileşimine açık kitle",
    cards: [
      { title: "Soru", text: "Şu anda en çok hangisi seni zorluyor? [A/B/C]" },
      { title: "Mini Anket", text: "Bugün [problem] yaşayan kaç kişiyiz?" },
      { title: "Kısa Çözüm", text: "Ben olsam ilk şunu kontrol ederdim: [adım]." },
      { title: "Örnek", text: "[kanıt] bunun neden işe yaradığını gösteriyor." },
      { title: "DM Açıcı", text: "İstersen sana özel hızlıca bakayım." },
      { title: "Anahtar Kelime", text: "Bana '[anahtar kelime]' yaz, sana yolu göndereyim." },
      { title: "Cevap Takibi", text: "Dünkü storyde yazanlara dönüş yapıyorum; sen de katılmak istersen DM açık." },
    ],
  },
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

function buildCards(templateId: StoryTemplateId): StoryCardDraft[] {
  return storyTemplates[templateId].cards.map((card, index) => ({
    day: index + 1,
    title: card.title,
    text: card.text,
    notes: `${storyTemplates[templateId].name} story sekansı. Görsel notu, sticker ve DM takip fikrini burada detaylandır.`,
    expected_revenue: "",
  }));
}

export function StorySalesClient({ storyItems }: StorySalesClientProps) {
  const [step, setStep] = useState<StoryStep>(1);
  const [storyName, setStoryName] = useState("");
  const [templateId, setTemplateId] = useState<StoryTemplateId>("warm-offer");
  const [startDate, setStartDate] = useState("");
  const [targetSegment, setTargetSegment] = useState(
    storyTemplates["warm-offer"].target
  );
  const [cards, setCards] = useState<StoryCardDraft[]>(() =>
    buildCards("warm-offer")
  );

  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await createStorySalesPlan(prevState, formData);
      return result;
    },
    initialState
  );

  const groups = useMemo(() => groupStoryItems(storyItems), [storyItems]);
  const selectedTemplate = storyTemplates[templateId];
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

  const selectTemplate = (id: StoryTemplateId) => {
    setTemplateId(id);
    setTargetSegment(storyTemplates[id].target);
    setCards(buildCards(id));
  };

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
              Hazır satış sekanslarından birini seç, story kartlarını düzenle ve
              her kartı ayrı çalışma sayfasında detaylandır.
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
              title="Hangi story sekansı?"
              description="İhtiyacına en yakın satış akışını seç; sonra tüm kartları düzenleyebilirsin."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(storyTemplates) as StoryTemplateId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTemplate(id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      templateId === id
                        ? "border-primary/30 bg-primary/8 shadow-sm"
                        : "border-border bg-background hover:border-primary/20"
                    )}
                  >
                    <p className="text-base font-semibold text-foreground">
                      {storyTemplates[id].name}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {storyTemplates[id].description}
                    </p>
                  </button>
                ))}
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
              title={`${selectedTemplate.name} kartlarını kontrol et`}
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
                  <Check className="h-4 w-4 text-primary" />
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
