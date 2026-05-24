"use client";

import { useMemo, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MonthlyMetric } from "@/lib/analytics/types";

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

interface QuarterIntelligenceAssistantProps {
  periodLabel: string;
  metrics: MonthlyMetric[];
}

const starters = [
  "Bu quarter için en kritik 3 içgörü ne?",
  "Önümüzdeki quarter için neye odaklanmalıyım?",
  "Gelir ve kârlılık tarafında risk var mı?",
];

export function QuarterIntelligenceAssistant({
  periodLabel,
  metrics,
}: QuarterIntelligenceAssistantProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = useMemo(
    () => `${periodLabel} için daha detaylı analiz iste...`,
    [periodLabel]
  );

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: AssistantMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/quarter-review/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodLabel,
          metrics,
          question: trimmed,
          history: messages.slice(-6),
        }),
      });

      const payload = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      if (!response.ok || !payload.answer) {
        throw new Error(payload.error ?? "Assistant cevap veremedi.");
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: payload.answer },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assistant cevap veremedi.");
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <section className="w-[min(calc(100vw-2rem),440px)] overflow-hidden rounded-2xl border border-border bg-card shadow-dropdown">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">
                  Intelligence Assistant
                </h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {periodLabel}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              aria-label="Assistant kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex max-h-[min(680px,calc(100vh-8rem))] flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/60 p-3">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
                    Seçili quarter verilerini kullanarak fikir, risk ve aksiyon
                    önerisi alabilirsin.
                  </div>
                  <div className="grid gap-2">
                    {starters.map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => ask(starter)}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[86%] whitespace-pre-wrap rounded-xl bg-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground"
                        : "max-w-[92%] whitespace-pre-wrap rounded-xl border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground"
                    }
                  >
                    {message.content}
                  </div>
                ))
              )}

              {isLoading && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analiz ediliyor...
                </div>
              )}
            </div>

            {error && (
              <div className="border-t border-red-200/80 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form
              className="space-y-2 border-t border-border bg-card p-3"
              onSubmit={(event) => {
                event.preventDefault();
                ask(input);
              }}
            >
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={placeholder}
                className="min-h-20 resize-none"
                disabled={isLoading}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                  Sor
                </Button>
              </div>
            </form>
          </div>
        </section>
      )}

      <Button
        type="button"
        className="h-12 rounded-full px-4 shadow-dropdown"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bot className="h-4 w-4" />
        Quarter AI
      </Button>
    </div>
  );
}
