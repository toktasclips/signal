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
type StoryTemplateId =
  | "many-client-proof"
  | "program-clarity"
  | "objection-breaker"
  | "educational-differentiation"
  | "personal-connection"
  | "client-results-obstacle"
  | "mission";

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
  "many-client-proof": {
    name: "Birçok Müşteriden Gelen Kanıtlar",
    description: "Birden fazla sonucu gösterip bunun şans değil sistem olduğunu anlatır.",
    target: "Kanıt görmek isteyen sıcak potansiyel müşteriler",
    cards: [
      {
        title: "Müşteri 1",
        text: "MÜŞTERİ1 geçen ay [X sonucu] aldı. Bunu [eşsiz mekanizma] uygulayarak yaptı.",
      },
      {
        title: "Müşteri 2",
        text: "MÜŞTERİ2 geçen ay [X sonucu] aldı. Aynı mekanizma burada da çalıştı.",
      },
      {
        title: "Müşteri 3",
        text: "MÜŞTERİ3 de [X sonucu] aldı. Arka arkaya gelen sonuçlar artık tesadüf değil.",
      },
      {
        title: "Şans Değil",
        text: "Bir noktadan sonra buna artık şans diyemezsin. Sistem önce bir kişi için çalıştı, sonra bir başkası için çalıştı.",
      },
      {
        title: "Tekrar Edilebilirlik",
        text: "Çalışan bir işin arka planındaki mekanizmaları anladığında başarıyı tekrar tekrar yeniden üretebilirsin.",
      },
      {
        title: "Çözüm Bizde",
        text: "Bizim yaptığımız şey tam olarak bu: neyin işe yaradığını bilip onu düzenli şekilde uygulatmak.",
      },
      {
        title: "CTA",
        text: "Eğer aynı sonuçları elde etmekle ilgileniyorsan bu story'ye \"SONUÇLAR\" yazarak cevap ver.",
      },
    ],
  },
  "program-clarity": {
    name: "Program Hakkında Açıklık",
    description: "Mantıklı alıcının programla ilgili sorularını sade şekilde yanıtlar.",
    target: "Programı merak eden ama netlik isteyen takipçiler",
    cards: [
      { title: "SSS Açılışı", text: "Programla ilgili en çok gelen soruları tek tek cevaplayayım." },
      { title: "Ne Yapar?", text: "Bu program tam olarak [istenen sonuç] için [ana problem] üzerinde çalışır." },
      { title: "Kimler İçin?", text: "Eğer [kitle tanımı] ve [mevcut durum] içindeysen bu yapı senin için uygun olabilir." },
      { title: "Nasıl İlerler?", text: "Süreç [adım 1], [adım 2], [adım 3] şeklinde ilerler. Karmaşık değil, takip edilebilir." },
      { title: "Neden Bu Program?", text: "Çünkü sadece bilgi vermiyoruz; [eşsiz mekanizma] ile uygulamayı ve sonucu merkeze alıyoruz." },
      { title: "Beklenti", text: "Burada amaç sihirli çözüm değil. Doğru problemi doğru sırayla çözmek." },
      { title: "CTA", text: "Programın sana uygun olup olmadığını görmek istersen bana \"PROGRAM\" yaz." },
    ],
  },
  "objection-breaker": {
    name: "Büyük İtirazları Aşmak",
    description: "Sınırlayıcı inancı gösterip gerçek bir örnekle kırar.",
    target: "Bahane, zaman, para veya güven itirazı olan potansiyel müşteriler",
    cards: [
      { title: "Hook", text: "\"[itiraz] yüzünden başarılı olamazsın\" cümlesi çoğu zaman doğru değil." },
      { title: "Karakter", text: "[Müşteri / ben] aynı itirazla başladı: [ana bahane veya sınırlayıcı inanç]." },
      { title: "Ek Acı", text: "Üstelik bir de [ikinci zorluk] vardı. Yani şartlar mükemmel değildi." },
      { title: "Karar", text: "Buna rağmen sürece girdi çünkü beklemek problemi çözmüyordu." },
      { title: "Sonuç", text: "Sonrasında [X sonuç] aldı. Buraya kanıt ekran görüntüsünü ekle." },
      { title: "Ders", text: "Sorun çoğu zaman şartlar değil; doğru çerçevenin ve sistemin olmaması." },
      { title: "CTA", text: "Senin itirazını da birlikte netleştirelim. Bana \"NET\" yaz." },
    ],
  },
  "educational-differentiation": {
    name: "Eğitimsel Farklılaştırma",
    description: "Problemi öğretir, sonra eşsiz çözüm modelini gösterir.",
    target: "Problemini anlayan ama çözüm farkını görmesi gereken takipçiler",
    cards: [
      { title: "Özel Değer", text: "Normalde ücretsiz olmaması gereken bir şeyi göstereceğim: [problemin gerçek nedeni]." },
      { title: "Nereden Biliyorum?", text: "Bunu [kanıt / deneyim / müşteri sonucu] sayesinde görüyorum." },
      { title: "Problemler", text: "İstediğin sonuca ulaşmanı engelleyen 3-4 sebep: [problem 1], [problem 2], [problem 3]." },
      { title: "Acıyı Derinleştir", text: "Bu problemler çözülmediğinde [sonuçsuzluk / maliyet / gecikme] üretmeye devam eder." },
      { title: "Model", text: "Bunu tersine çeviren modelin adı: [model adı]." },
      { title: "Kanıt", text: "Bu model sayesinde [X kişi / X müşteri] şu sonucu aldı: [kanıt]." },
      { title: "CTA", text: "Modeli kendi işine nasıl uyarlayacağını görmek istersen \"MODEL\" yaz." },
    ],
  },
  "personal-connection": {
    name: "Kişisel Bağ",
    description: "Daha insani, günlük ve doğal bir bağ kurar.",
    target: "Seni daha yakından tanıması gereken takipçiler",
    cards: [
      { title: "Günlük An", text: "Bugün [aktivite / yer / küçük an] sırasında şunu düşündüm..." },
      { title: "Kişisel Hikaye", text: "Eskiden ben de [kişisel durum] içindeydim ve bu bana şunu öğretti." },
      { title: "Değer", text: "Benim için [değer / felsefe] sadece işte değil hayatta da önemli." },
      { title: "Bağ Kurma", text: "Bunu anlatıyorum çünkü burada sadece sonuç değil, o sonucu nasıl yaşadığımız da önemli." },
      { title: "Perde Arkası", text: "Şu aralar üzerinde çalıştığım şey: [arka plan / süreç / küçük detay]." },
      { title: "İnsan Tarafı", text: "Bazen işin en güçlü tarafı daha fazla taktik değil, daha net bir hayat kurmak oluyor." },
      { title: "Soft CTA", text: "Bunu yaşayan biriysen bana cevap ver; merak ediyorum sende nasıl görünüyor." },
    ],
  },
  "client-results-obstacle": {
    name: "Müşteri Sonuçları + Engeli Kaldır",
    description: "Müşteri sonucu üzerinden katılma engelini ve şüpheyi kaldırır.",
    target: "Kendini müşteriyle özdeşleştirmesi gereken leadler",
    cards: [
      { title: "Müşteriyi Tanıt", text: "[Müşteri], programa katılmadan önce [başlangıç durumu] içindeydi." },
      { title: "Bağlam", text: "En büyük problemi [problem] idi ve bu yüzden [istenmeyen sonuç] yaşıyordu." },
      { title: "İtiraz", text: "Başta [itiraz] yüzünden katılmak istemedi. Bu gayet anlaşılırdı." },
      { title: "Karar", text: "Ama bu itirazı şöyle yeniden çerçeveledik: [itiraz kırma]." },
      { title: "Katılım", text: "Sonra sürece girdi ve [uygulanan mekanizma] üzerinde çalışmaya başladı." },
      { title: "Sonuç", text: "Kısa süre sonra [X sonuç] aldı. Buraya referans veya ekran görüntüsü ekle." },
      { title: "CTA", text: "Benzer bir noktadaysan ve engelini netleştirmek istiyorsan bana \"BAŞLA\" yaz." },
    ],
  },
  mission: {
    name: "Misyon",
    description: "Bunu sadece para için yapmadığını gösterip daha derin bağ kurar.",
    target: "Seni ve işin arkasındaki nedeni anlaması gereken takipçiler",
    cards: [
      { title: "Misyon Hook", text: "Benim için bu işin meselesi sadece satış yapmak değil." },
      { title: "Hazır Olma", text: "Eğitim-koçluk işinin satın alınan değil, hazır olunduğunda başlanan bir iş olmasını göstermek istiyorum." },
      { title: "Keyifli İş", text: "İnsanların keyif alabildiği kişilerle, ekipleşmeden, stres yaşamadan çalışarak bir iş büyütmesini istiyorum." },
      { title: "Başka Yol", text: "Çok yorucu iş olmadan ve düşük kalite müşterilerle uğraşmadan da büyük bir iş kurulabileceğini göstermek istiyorum." },
      { title: "Para Değil", text: "Para önemli, ama misyon yoksa iş çok hızlı şekilde sadece yüke dönüşüyor." },
      { title: "Ne Beklemelisin?", text: "Hiçbir şeyde sihir yok. Uygula, sonucu gör, düzelt ve daha iyi hale getir." },
      { title: "CTA", text: "Bu misyon sende de bir yere dokunuyorsa bana cevap ver; bunu kimlerle inşa ettiğim önemli." },
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
  const [templateId, setTemplateId] =
    useState<StoryTemplateId>("many-client-proof");
  const [startDate, setStartDate] = useState("");
  const [targetSegment, setTargetSegment] = useState(
    storyTemplates["many-client-proof"].target
  );
  const [cards, setCards] = useState<StoryCardDraft[]>(() =>
    buildCards("many-client-proof")
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
