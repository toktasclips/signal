"use client";

import { useMemo, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
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
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Intelligence Assistant
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Seçili quarter verilerini kullanarak fikir, risk ve aksiyon önerisi al.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {messages.length === 0 ? (
          <div className="grid gap-2 md:grid-cols-3">
            {starters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => ask(starter)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {starter}
              </button>
            ))}
          </div>
        ) : (
          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-border bg-background p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[82%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[88%] rounded-lg border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground"
                }
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analiz ediliyor...
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            ask(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            className="min-h-24 resize-none"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              Sor
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
