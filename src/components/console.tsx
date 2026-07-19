import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { analyzeTranscript } from "@/lib/analyze.functions";
import { parseTranscript } from "@/lib/parse-transcript";
import { SAMPLE_TRANSCRIPT } from "@/lib/sample-transcript";
import type { AnalyzeResult, Confidence, Message } from "@/lib/report-types";
import { TranscriptPane } from "./transcript-pane";
import { ReportPane } from "./report-pane";

export type ReviewAction = "approved" | "edited" | "rejected" | null;
export interface ReviewState {
  action: ReviewAction;
  edited_text: string | null;
}

export function Console() {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [transcriptDirty, setTranscriptDirty] = useState(false);
  const analyzedTranscript = useRef<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const messages: Message[] = useMemo(() => parseTranscript(transcript), [transcript]);

  const mutation = useMutation({
    mutationFn: async (t: string) => analyzeTranscript({ data: { transcript: t } }),
    onSuccess: (r) => {
      setResult(r);
      setReviews({});
      analyzedTranscript.current = transcript;
      setTranscriptDirty(false);
    },
  });

  // Detect transcript edits after a report has been generated
  useEffect(() => {
    if (
      result &&
      analyzedTranscript.current !== null &&
      transcript !== analyzedTranscript.current
    ) {
      setTranscriptDirty(true);
    } else {
      setTranscriptDirty(false);
    }
  }, [transcript, result]);

  const handleRetry = useCallback(() => {
    mutation.mutate(transcript);
  }, [transcript, mutation]);

  const cardKeys = useMemo(() => (result ? collectCardKeys(result) : []), [result]);
  const allActioned = cardKeys.length > 0 && cardKeys.every((k) => reviews[k]?.action);

  const setReview = (key: string, state: ReviewState) =>
    setReviews((prev) => ({ ...prev, [key]: state }));

  const jumpToEvidence = (id: string) => {
    setHighlightId(id);
    const el = messageRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 2200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              GenAI Client Intelligence Console
            </div>
            <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight">
              Weekly Client Report
            </h1>
          </div>
          <StatusPill hasReport={!!result} allActioned={allActioned} />
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-6 py-6 lg:grid-cols-[minmax(320px,32%)_1fr]">
        <TranscriptPane
          transcript={transcript}
          setTranscript={setTranscript}
          messages={messages}
          onAnalyze={() => mutation.mutate(transcript)}
          onLoadSample={() => setTranscript(SAMPLE_TRANSCRIPT)}
          isLoading={mutation.isPending}
          highlightId={highlightId}
          messageRefs={messageRefs}
        />
        <ReportPane
          result={result}
          error={mutation.error instanceof Error ? mutation.error.message : null}
          isLoading={mutation.isPending}
          reviews={reviews}
          setReview={setReview}
          onEvidenceClick={jumpToEvidence}
          onRetry={handleRetry}
          transcriptDirty={transcriptDirty}
        />
      </main>
    </div>
  );
}

function StatusPill({ hasReport, allActioned }: { hasReport: boolean; allActioned: boolean }) {
  if (!hasReport) {
    return (
      <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        No report yet
      </span>
    );
  }
  if (allActioned) {
    return (
      <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        ● Reviewed
      </span>
    );
  }
  return (
    <span className="rounded-full border border-amber-300/60 bg-amber-100/60 px-3 py-1 text-xs font-semibold text-amber-800">
      ● Draft — Pending Review
    </span>
  );
}

function collectCardKeys(r: AnalyzeResult): string[] {
  const keys = ["summary", "next-action"];
  for (const k of Object.keys(r.report.dimensions)) keys.push(`dim-${k}`);
  r.report.key_barriers.forEach((_, i) => keys.push(`barrier-${i}`));
  r.report.pending_actions.forEach((_, i) => keys.push(`pending-${i}`));
  r.report.risk_flags.forEach((_, i) => keys.push(`risk-${i}`));
  return keys;
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed_fact: "Confirmed Fact",
  client_reported: "Client-Reported",
  ai_inference: "AI Inference",
  missing: "Missing",
};

export const CONFIDENCE_CLASS: Record<Confidence, string> = {
  confirmed_fact: "bg-emerald-100 text-emerald-800 border-emerald-300",
  client_reported: "bg-sky-100 text-sky-800 border-sky-300",
  ai_inference: "bg-amber-100 text-amber-900 border-amber-300",
  missing: "bg-neutral-200 text-neutral-600 border-neutral-300",
};
