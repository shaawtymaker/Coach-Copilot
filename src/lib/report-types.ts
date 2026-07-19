import { z } from "zod";

export type Confidence = "confirmed_fact" | "client_reported" | "ai_inference" | "missing";

const confidenceSchema = z
  .enum(["confirmed_fact", "client_reported", "ai_inference", "missing"])
  .catch("ai_inference");

const evidenceSchema = z.array(z.string()).catch([]);

const dimensionSchema = z.object({
  status: z.string().catch("No data reported this week"),
  confidence: confidenceSchema,
  evidence: evidenceSchema,
});

const defaultDimension = (): Dimension => ({
  status: "No data reported this week",
  confidence: "missing",
  evidence: [],
});

const barrierSchema = z.object({
  text: z.string().catch(""),
  confidence: confidenceSchema,
  evidence: evidenceSchema,
});

const pendingActionSchema = z.object({
  text: z.string().catch(""),
  status: z.enum(["open", "unclear"]).catch("unclear"),
  evidence: evidenceSchema,
});

const riskFlagSchema = z.object({
  text: z.string().catch(""),
  severity: z.enum(["low", "medium", "high"]).catch("low"),
  rationale: z.string().catch(""),
  confidence: confidenceSchema,
  evidence: evidenceSchema,
});

export const reportSchema = z.object({
  week_range: z.string().catch("Unknown"),
  weekly_summary: z
    .object({
      text: z.string().catch("No summary available."),
      evidence: evidenceSchema,
    })
    .catch({ text: "No summary available.", evidence: [] }),
  dimensions: z
    .object({
      nutrition_adherence: dimensionSchema.catch(defaultDimension()),
      exercise_steps: dimensionSchema.catch(defaultDimension()),
      sleep: dimensionSchema.catch(defaultDimension()),
      water_intake: dimensionSchema.catch(defaultDimension()),
      symptoms_stress: dimensionSchema.catch(defaultDimension()),
      engagement_level: dimensionSchema.catch(defaultDimension()),
    })
    .catch({
      nutrition_adherence: defaultDimension(),
      exercise_steps: defaultDimension(),
      sleep: defaultDimension(),
      water_intake: defaultDimension(),
      symptoms_stress: defaultDimension(),
      engagement_level: defaultDimension(),
    }),
  key_barriers: z.array(barrierSchema).catch([]),
  pending_actions: z.array(pendingActionSchema).catch([]),
  risk_flags: z.array(riskFlagSchema).catch([]),
  recommended_next_action: z
    .object({
      text: z.string().catch("No recommendation available."),
      rationale: z.string().catch(""),
      evidence: evidenceSchema,
    })
    .catch({ text: "No recommendation available.", rationale: "", evidence: [] }),
});

export interface Dimension {
  status: string;
  confidence: Confidence;
  evidence: string[];
}

export interface Barrier {
  text: string;
  confidence: Confidence;
  evidence: string[];
}

export interface PendingAction {
  text: string;
  status: "open" | "unclear";
  evidence: string[];
}

export interface RiskFlag {
  text: string;
  severity: "low" | "medium" | "high";
  rationale: string;
  confidence: Confidence;
  evidence: string[];
}

export interface Report {
  week_range: string;
  weekly_summary: { text: string; evidence: string[] };
  dimensions: {
    nutrition_adherence: Dimension;
    exercise_steps: Dimension;
    sleep: Dimension;
    water_intake: Dimension;
    symptoms_stress: Dimension;
    engagement_level: Dimension;
  };
  key_barriers: Barrier[];
  pending_actions: PendingAction[];
  risk_flags: RiskFlag[];
  recommended_next_action: { text: string; rationale: string; evidence: string[] };
}

export interface Message {
  id: string;
  day: string;
  sender: string;
  text: string;
}

export interface AnalyzeResult {
  report: Report;
  prompt: string;
  raw: string;
}
