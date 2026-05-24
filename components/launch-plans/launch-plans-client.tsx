"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Rocket,
} from "lucide-react";
import { createCampaignLaunchPlan } from "@/actions/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ActionState, CampaignCalendarItem } from "@/types";

type LaunchDuration = 7 | 14;
type LaunchStep = 1 | 2 | 3 | 4 | 5;

interface LaunchPlansClientProps {
  launchItems: CampaignCalendarItem[];
}

interface LaunchCardDraft {
  day: number;
  title: string;
  angle: string;
  notes: string;
  expected_revenue: string;
}

const initialState: ActionState = { status: "idle" };

const sevenDayAngles = [
  "Lansman",
  "Acı Noktası",
  "Sosyal Kanıt",
  "Felsefe",
  "Plan",
  "Takip",
  "Son Çağrı",
];

const fourteenDayAngles = [
  ...sevenDayAngles,
  "Soru-Cevap",
  "İtiraz Kırma",
  "Demo",
  "Bonus",
  "Karşılaştırma",
  "Takip",
  "Final",
];

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

function extractLaunchName(item: CampaignCalendarItem): string {
  const match = item.notes?.match(/Lansman:\s*(.+)/);
  return match?.[1]?.split("\n")[0]?.trim() || "Lansman";
}

function groupLaunchItems(items: CampaignCalendarItem[]) {
  const groups = new Map<string, CampaignCalendarItem[]>();
  items.forEach((item) => {
    const name = extractLaunchName(item);
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

function buildCards({
  duration,
  problem,
  proof,
  philosophy,
  plan,
}: {
  duration: LaunchDuration;
  problem: string;
  proof: string;
  philosophy: string;
  plan: string;
}): LaunchCardDraft[] {
  const angles = duration === 7 ? sevenDayAngles : fourteenDayAngles;
  return angles.map((angle, index) => {
    const day = index + 1;
    const source =
      angle === "Sosyal Kanıt"
        ? proof
        : angle === "Felsefe"
          ? philosophy
          : angle === "Plan"
            ? plan
            : problem;

    return {
      day,
      title: angle,
      angle:
        source.trim() ||
        (angle === "Sosyal Kanıt"
          ? "Vaka, sonuç, yorum veya müşteri kanıtı"
          : angle === "Felsefe"
            ? "Teklifin arkasındaki bakış açısı"
            : angle === "Plan"
              ? "Kitleye net yol haritası"
              : "Ana problem ve satın alma sebebi"),
      notes: `${angle} açısı için içerik taslağı, CTA ve DM takip notları.`,
      expected_revenue: "",
    };
  });
}

export function LaunchPlansClient({ launchItems }: LaunchPlansClientProps) {
  const [step, setStep] = useState<LaunchStep>(1);
  const [launchName, setLaunchName] = useState("");
  const [duration, setDuration] = useState<LaunchDuration>(7);
  const [startDate, setStartDate] = useState("");
  const [problem, setProblem] = useState("");
  const [proof, setProof] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [plan, setPlan] = useState("");
  const [cards, setCards] = useState<LaunchCardDraft[]>(() =>
    buildCards({ duration: 7, problem: "", proof: "", philosophy: "", plan: "" })
  );

  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await createCampaignLaunchPlan(prevState, formData);
      return result;
    },
    initialState
  );

  const groups = useMemo(() => groupLaunchItems(launchItems), [launchItems]);
  const payload = useMemo(
    () =>
      JSON.stringify(
        cards.map((card) => ({
          day: card.day,
          title: card.title,
          offer: card.angle,
          notes: card.notes,
          expected_revenue: card.expected_revenue,
        }))
      ),
    [cards]
  );

  const canContinue =
    (step === 1 && launchName.trim().length > 0) ||
    step === 2 ||
    (step === 3 && startDate.length > 0) ||
    (step === 4 &&
      [problem, proof, philosophy, plan].some((value) => value.trim().length > 0)) ||
    step === 5;

  const next = () => {
    if (!canContinue || step === 5) return;
    if (step === 4) {
      setCards(buildCards({ duration, problem, proof, philosophy, plan }));
    }
    setStep((current) => Math.min(5, current + 1) as LaunchStep);
  };

  const back = () => setStep((current) => Math.max(1, current - 1) as LaunchStep);

  const updateCard = (
    day: number,
    key: keyof Omit<LaunchCardDraft, "day">,
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
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Yeni Lansman Ekle
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Lansmanı önce strateji bloklarıyla kur, sonra gün gün içerik akışını
              kontrol edip takvime aktar.
            </p>
          </div>
          <div className="hidden gap-1 sm:flex">
            {[1, 2, 3, 4, 5].map((item) => (
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
            if (step < 5) {
              event.preventDefault();
              next();
            }
          }}
        >
          <input type="hidden" name="launch_name" value={launchName} />
          <input type="hidden" name="duration" value={duration} />
          <input type="hidden" name="start_date" value={startDate} />
          <input type="hidden" name="target_segment" value="Lansman kitlesi" />
          <input type="hidden" name="channel" value="Platform Launch" />
          <input type="hidden" name="items" value={payload} />

          {step === 5 && state.status === "error" && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive">
                {state.error ?? "Lansman planı oluşturulamadı."}
              </p>
            </div>
          )}

          {state.status === "success" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-medium text-emerald-700">
                Lansman takvime eklendi. Kampanya Takvimi’nde gün gün görünecek.
              </p>
            </div>
          )}

          {step === 1 && (
            <StepPanel
              label="1. Adım"
              title="Kampanyanın ismi ne?"
              description="Bu isim hem burada hem Kampanya Takvimi’nde lansman grubunu tanımlar."
            >
              <div className="max-w-xl space-y-1.5">
                <Label htmlFor="launch-name">Kampanya İsmi</Label>
                <Input
                  id="launch-name"
                  value={launchName}
                  onChange={(event) => setLaunchName(event.target.value)}
                  placeholder="Örn. Haziran Platform Lansmanı"
                />
              </div>
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel
              label="2. Adım"
              title="Lansman kaç gün sürecek?"
              description="Kısa ve yoğun akış için 7 gün, daha fazla açı ve takip için 14 gün seç."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[7, 14].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDuration(item as LaunchDuration)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      duration === item
                        ? "border-primary/30 bg-primary/8 shadow-sm"
                        : "border-border bg-background hover:border-primary/20"
                    )}
                  >
                    <p className="text-base font-semibold text-foreground">
                      {item} Günlük Lansman
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item === 7
                        ? "Lansman, acı noktası, kanıt, felsefe, plan ve takip."
                        : "Daha geniş hikaye, itiraz kırma, demo ve final takipleri."}
                    </p>
                  </button>
                ))}
              </div>
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel
              label="3. Adım"
              title="Başlangıç günü ne olsun?"
              description="Seçtiğin güne göre 7 veya 14 günlük kartlar otomatik tarihlenecek."
            >
              <div className="max-w-sm space-y-1.5">
                <Label htmlFor="start-date">Başlangıç Günü</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel
              label="4. Adım"
              title="Kampanya geliştirme bloklarını doldur"
              description="Problem, sosyal kanıt, felsefe ve plan blokları gün gün içerik akışının omurgası olacak."
            >
              <div className="grid gap-3 lg:grid-cols-4">
                <LaunchBlock
                  title="Problemler"
                  value={problem}
                  onChange={setProblem}
                  placeholder="Satış görüşmesi, etkileşim, güven, fiyat itirazı..."
                />
                <LaunchBlock
                  title="Sosyal Kanıtlar"
                  value={proof}
                  onChange={setProof}
                  placeholder="Müşteri isimleri, sonuçlar, yorumlar, ekran görüntüleri..."
                />
                <LaunchBlock
                  title="Felsefe"
                  value={philosophy}
                  onChange={setPhilosophy}
                  placeholder="Hayatımızı finanse etmeli, keyif almalıyız, girişimci ol..."
                />
                <LaunchBlock
                  title="Plan"
                  value={plan}
                  onChange={setPlan}
                  placeholder="1. adım, 2. adım, 3. adım..."
                />
              </div>
            </StepPanel>
          )}

          {step === 5 && (
            <StepPanel
              label="5. Adım"
              title="Gün gün lansman akışını kontrol et"
              description="Kartları burada düzenleyip kaydettiğinde otomatik Kampanya Takvimi’ne düşer."
            >
              <div className="grid gap-3 lg:grid-cols-7">
                {cards.map((card) => {
                  const date = addDays(startDate, card.day - 1);
                  return (
                    <div
                      key={card.day}
                      className="rounded-xl border border-border bg-background p-3 shadow-sm lg:col-span-1"
                    >
                      <div className="mb-3">
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                          Gün {card.day}
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
                          aria-label={`Gün ${card.day} başlık`}
                        />
                        <Textarea
                          value={card.angle}
                          onChange={(event) =>
                            updateCard(card.day, "angle", event.target.value)
                          }
                          aria-label={`Gün ${card.day} açı`}
                          className="h-24 resize-none"
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
                          aria-label={`Gün ${card.day} beklenen gelir`}
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

            {step < 5 ? (
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
                    Takvime Ekle
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
            Lansman İçerik Takvimi
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kaydedilen lansmanları gün gün buradan kontrol edebilirsin.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">
              Henüz lansman planı yok
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
                      {group.items.length} günlük akış
                    </p>
                  </div>
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {group.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-background p-3"
                    >
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Gün {index + 1} · {formatDate(item.planned_date)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {item.title.split(": ").pop()}
                      </p>
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                        {item.offer}
                      </p>
                    </div>
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

function LaunchBlock({
  title,
  value,
  onChange,
  placeholder,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <Label>{title}</Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-44 resize-none"
      />
    </div>
  );
}
