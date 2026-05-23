import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const VALID_TAGS = [
  // Objections
  "price_objection",
  "timing_objection",
  "spouse_objection",
  "trust_objection",
  "decision_delay",
  // Intent
  "high_intent",
  "warm_interest",
  "passive_interest",
  "ghosting_risk",
  "urgent_need",
  // Sentiment
  "positive_sentiment",
  "neutral_sentiment",
  "negative_sentiment",
] as const;

export type SemanticTagName = (typeof VALID_TAGS)[number];

interface TagResult {
  tag: SemanticTagName;
  confidence: number;
}

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function classifyText(text: string): Promise<TagResult[]> {
  const openai = getClient();
  if (!openai) return [];

  const trimmed = text.trim();
  if (trimmed.length < 8) return [];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 150,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a sales signal classifier. Analyze the note and return matching tags as JSON {tags:[{tag,confidence}]}. " +
            "Valid tags: " +
            VALID_TAGS.join(",") +
            ". Only include tags with confidence>0.65, max 3 tags.",
        },
        {
          role: "user",
          content: trimmed.slice(0, 300),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return [];

    const parsed = JSON.parse(raw) as { tags?: unknown[] };
    if (!Array.isArray(parsed.tags)) return [];

    return parsed.tags
      .filter(
        (t): t is TagResult =>
          typeof t === "object" &&
          t !== null &&
          "tag" in t &&
          "confidence" in t &&
          VALID_TAGS.includes((t as TagResult).tag) &&
          typeof (t as TagResult).confidence === "number"
      )
      .slice(0, 3);
  } catch {
    return [];
  }
}

export interface AnalyzeParams {
  userId: string;
  leadId: string | null;
  sourceType: "lead_note" | "quick_note" | "lost_reason" | "task_description";
  sourceId: string;
  text: string | null | undefined;
}

/**
 * Classify text and upsert semantic tags for the given source.
 * Deletes existing tags for the source before inserting new ones.
 * Safe to call fire-and-forget — never throws.
 */
export async function analyzeAndSaveTags(params: AnalyzeParams): Promise<void> {
  try {
    if (!params.text || params.text.trim().length < 8) return;

    const tags = await classifyText(params.text);

    const supabase = await createClient();

    // Delete existing tags for this source
    await supabase
      .from("semantic_tags")
      .delete()
      .eq("user_id", params.userId)
      .eq("source_type", params.sourceType)
      .eq("source_id", params.sourceId);

    if (tags.length === 0) return;

    await supabase.from("semantic_tags").insert(
      tags.map((t) => ({
        user_id: params.userId,
        lead_id: params.leadId,
        source_type: params.sourceType,
        source_id: params.sourceId,
        tag: t.tag,
        confidence: t.confidence,
      }))
    );
  } catch {
    // Never fail the parent action
  }
}
