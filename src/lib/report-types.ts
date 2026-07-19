export type Confidence = "confirmed_fact" | "client_reported" | "ai_inference" | "missing";

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