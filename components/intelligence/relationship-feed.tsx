"use client";

import { useState } from "react";
import { RelationshipInsightCard } from "./relationship-insight-card";
import type { RelationshipInsight } from "@/types";

interface RelationshipFeedProps {
  insights: RelationshipInsight[];
}

export function RelationshipFeed({ insights: initial }: RelationshipFeedProps) {
  const [insights, setInsights] = useState(initial);

  const unread = insights.filter((i) => !i.is_read).length;

  function handleDismiss(id: string) {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }

  function handleRead(id: string) {
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_read: true } : i))
    );
  }

  if (insights.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        No insights yet. Add leads, log activity and run deals to surface patterns.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <p className="text-xs text-muted-foreground">
          {unread} unread insight{unread > 1 ? "s" : ""}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((insight) => (
          <RelationshipInsightCard
            key={insight.id}
            insight={insight}
            onDismiss={handleDismiss}
            onRead={handleRead}
          />
        ))}
      </div>
    </div>
  );
}
