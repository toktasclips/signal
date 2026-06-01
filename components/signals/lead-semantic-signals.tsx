"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { SemanticTagBadge } from "./semantic-tag-badge";
import type { SemanticTag, SemanticTagName } from "@/types";

interface LeadSemanticSignalsProps {
  leadId: string;
}

export function LeadSemanticSignals({ leadId }: LeadSemanticSignalsProps) {
  const [tags, setTags] = useState<SemanticTag[] | null>(null);

  useEffect(() => {
    fetch(`/api/semantic-tags?leadId=${leadId}`)
      .then((r) => r.json())
      .then((data) => setTags(data.tags ?? []))
      .catch(() => setTags([]));
  }, [leadId]);

  if (tags === null) return null; // loading — show nothing
  if (tags.length === 0) return null; // no signals detected

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Semantic Signals</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <SemanticTagBadge
            key={t.id}
            tag={t.tag as SemanticTagName}
            confidence={t.confidence}
          />
        ))}
      </div>
    </div>
  );
}
