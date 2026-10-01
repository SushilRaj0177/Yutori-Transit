import "server-only";
import type { Bilingual } from "@/engine/types";
import { explain, narrationFacts, type Facts } from "@/core/explain";
import { checkNarration } from "@/core/narration-check";

/**
 * Optional LLM layer. It turns the deterministic facts into a friendlier two
 * sentence briefing. It never chooses the door, and any output that cites a
 * number not present in the facts is discarded in favour of the template.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Verified on 2026-10-01: passes checkNarration reliably in ~0.5 s. The gpt-oss
// models failed Groq's JSON mode on this prompt.
const DEFAULT_MODEL = "qwen/qwen3.8-27b";

export interface Narration {
  text: Bilingual;
  source: "llm" | "template";
  model?: string;
  rejected?: string;
}

const SYSTEM = `You write boarding tips for Tokyo subway riders.
You receive JSON facts computed by an optimisation engine. Rewrite them as a short, calm tip.
Rules:
- Use ONLY numbers that appear in the facts. Never invent stations, exits, times, or percentages.
- "crowd" is relative to the rest of the same train (quieter / average / busier). Describe it in words.
  Never turn it into a percentage. Only quote a load percentage if a "loadPct" field is present.
- If loadSource is "estimate", say crowding is "usually" so (English) / 普段は (Japanese): it is not measured.
- Only call a door the fastest if it is the "fastest" entry, and a car the roomiest if it is the "roomiest" entry.
- At most 2 sentences per language. No greetings, no emoji.
Reply with JSON: {"en": "...", "ja": "..."} where "ja" is natural polite Japanese (です・ます).`;

export async function narrate(facts: Facts): Promise<Narration> {
  const template = { text: explain(facts), source: "template" as const };
  const key = process.env.GROQ_API_KEY;
  if (!key) return template;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify(narrationFacts(facts)) },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ...template, rejected: `HTTP ${res.status}` };
    const body = await res.json();
    const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
    const text = { en: String(parsed.en ?? ""), ja: String(parsed.ja ?? "") };
    const problem = checkNarration(text, narrationFacts(facts));
    if (problem) return { ...template, rejected: problem };
    return { text, source: "llm", model };
  } catch (err) {
    return { ...template, rejected: (err as Error).name };
  }
}
