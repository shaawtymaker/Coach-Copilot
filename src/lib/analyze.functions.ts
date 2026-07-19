import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseTranscript, formatForPrompt } from "./parse-transcript";
import type { AnalyzeResult, Report } from "./report-types";

const InputSchema = z.object({ transcript: z.string().min(1) });

function buildPrompt(numbered: string): string {
  return [
    "You are a client-intelligence extraction assistant for a health & fitness coach. You will be given a numbered client-coach conversation. Extract a structured weekly report as JSON ONLY (no markdown fences, no preamble, no commentary).",
    "",
    "STRICT RULES:",
    "1. Every evidence reference must be an exact message ID from the list below (e.g. \"D3.4\"). Never invent an ID. Never quote or paraphrase text yourself in the \"evidence\" field — only put IDs there.",
    "2. confidence must be exactly one of: \"confirmed_fact\", \"client_reported\", \"ai_inference\", \"missing\".",
    "   - \"confirmed_fact\": stated directly and unambiguously (objective, not open to interpretation).",
    "   - \"client_reported\": stated by the client but subjective/self-reported/unverifiable.",
    "   - \"ai_inference\": not stated directly; you inferred it from context or patterns.",
    "   - \"missing\": no evidence in the conversation either way. Do NOT guess a status to fill this in — if missing, set status to \"No data reported this week\" and evidence to [].",
    "3. NEVER invent a specific number (steps, litres, hours, kg) that was not stated in a message.",
    "4. risk_flags: be conservative. Only include something here if it plausibly warrants proactive coach attention (physical symptoms persisting, signs of exhaustion/burnout, sharp disengagement, safety-relevant language). Each flag needs a rationale and severity (\"low\"|\"medium\"|\"high\").",
    "5. Output must be valid JSON matching this schema:",
    '{',
    '  "week_range": "string",',
    '  "weekly_summary": { "text": "string", "evidence": ["string"] },',
    '  "dimensions": {',
    '    "nutrition_adherence": { "status": "string", "confidence": "string", "evidence": ["string"] },',
    '    "exercise_steps": { "status": "string", "confidence": "string", "evidence": ["string"] },',
    '    "sleep": { "status": "string", "confidence": "string", "evidence": ["string"] },',
    '    "water_intake": { "status": "string", "confidence": "string", "evidence": ["string"] },',
    '    "symptoms_stress": { "status": "string", "confidence": "string", "evidence": ["string"] },',
    '    "engagement_level": { "status": "string", "confidence": "string", "evidence": ["string"] }',
    '  },',
    '  "key_barriers": [{ "text": "string", "confidence": "string", "evidence": ["string"] }],',
    '  "pending_actions": [{ "text": "string", "status": "open|unclear", "evidence": ["string"] }],',
    '  "risk_flags": [{ "text": "string", "severity": "low|medium|high", "rationale": "string", "confidence": "string", "evidence": ["string"] }],',
    '  "recommended_next_action": { "text": "string", "rationale": "string", "evidence": ["string"] }',
    '}',
    "",
    "CONVERSATION (numbered messages):",
    "",
    numbered,
    "",
    "Return ONLY the JSON object.",
  ].join("\n");
}

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export const analyzeTranscript = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const messages = parseTranscript(data.transcript);
    if (messages.length === 0) {
      throw new Error("No parseable messages. Use format: D1 | Sender: text");
    }

    const numbered = formatForPrompt(messages);
    const prompt = buildPrompt(numbered);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Rate limit exceeded. Please retry shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits to your Lovable workspace.");
      throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 300)}`);
    }

    const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = payload.choices?.[0]?.message?.content ?? "";

    let report: Report;
    try {
      report = JSON.parse(raw) as Report;
    } catch {
      try {
        report = JSON.parse(stripFences(raw)) as Report;
      } catch {
        throw new Error(`Model did not return valid JSON. Raw:\n${raw.slice(0, 800)}`);
      }
    }

    return { report, prompt, raw };
  });