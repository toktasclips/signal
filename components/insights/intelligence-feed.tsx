"use client";

import { useState } from "react";
import { InsightCard } from "./insight-card";
import type { Insight } from "@/types";

interface IntelligenceFeedProps {
  insights: Insight[];
}

export function IntelligenceFeed({ insights: initial }: IntelligenceFeedProps) {
  const [insights, setInsights] = useState(initial);

  if (insights.length === 0) return null;

  const unread = insights.filter((i) => !i.is_read).length;

  function handleDismiss(id: string) {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }

  function handleRead(id: string) {
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_read: true } : i))
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground">Intelligence</h2>
        {unread > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {unread}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onDismiss={handleDismiss}
            onRead={handleRead}
          />
        ))}
      </div>
    </section>
  );
}
