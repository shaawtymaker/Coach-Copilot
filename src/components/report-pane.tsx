import { useState, type ReactNode } from "react";
import type { AnalyzeResult, Confidence } from "@/lib/report-types";
import { CONFIDENCE_CLASS, CONFIDENCE_LABEL, type ReviewState } from "./console";

interface Props {
  result: AnalyzeResult | null;
  error: string | null;
  isLoading: boolean;
  reviews: Record<string, ReviewState>;
  setReview: (key: string, state: ReviewState) => void;
  onEvidenceClick: (id: string) => void;
}

export function ReportPane({ result, error, isLoading, reviews, setReview, onEvidenceClick }: Props) {
  if (isLoading && !result) return <EmptyState title="Analyzing transcript…" subtitle="Extracting structured intelligence." />;
  if (error) return <ErrorState message={error} />;
  if (!result) return <EmptyState title="No report yet" subtitle="Paste a transcript and click Analyze Week." />;

  const r = result.report;
  const dims = r.dimensions;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Week Range</div>
          <div className="mt-1 font-serif text-xl">{r.week_range || "—"}</div>
        </div>
      </div>

      <ReviewCard
        cardKey="summary"
        title="Weekly Summary"
        reviews={reviews}
        setReview={setReview}
        defaultText={r.weekly_summary.text}
      >
        <p className="text-sm leading-relaxed text-foreground/90">{r.weekly_summary.text}</p>
        <EvidenceChips ids={r.weekly_summary.evidence} onClick={onEvidenceClick} />
      </ReviewCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DimensionCard k="nutrition_adherence" label="Nutrition Adherence" d={dims.nutrition_adherence} reviews={reviews} setReview={setReview} onEvidenceClick={onEvidenceClick} />
        <DimensionCard k="exercise_steps" label="Exercise / Steps" d={dims.exercise_steps} reviews={reviews} setReview={setReview} onEvidenceClick={onEvidenceClick} />
        <DimensionCard k="sleep" label="Sleep" d={dims.sleep} reviews={reviews} setReview={setReview} onEvidenceClick={onEvidenceClick} />
        <DimensionCard k="water_intake" label="Water Intake" d={dims.water_intake} reviews={reviews} setReview={setReview} onEvidenceClick={onEvidenceClick} />
        <DimensionCard k="symptoms_stress" label="Symptoms / Stress" d={dims.symptoms_stress} reviews={reviews} setReview={setReview} onEvidenceClick={onEvidenceClick} />
        <DimensionCard k="engagement_level" label="Engagement" d={dims.engagement_level} reviews={reviews} setReview={setReview} onEvidenceClick={onEvidenceClick} />
      </div>

      <ListSection title="Key Barriers" empty="No barriers identified.">
        {r.key_barriers.map((b, i) => (
          <ReviewCard key={i} cardKey={`barrier-${i}`} title={`Barrier ${i + 1}`} reviews={reviews} setReview={setReview} defaultText={b.text} compact>
            <p className="text-sm text-foreground/90">{b.text}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ConfidenceBadge c={b.confidence} />
              <EvidenceChips ids={b.evidence} onClick={onEvidenceClick} />
            </div>
          </ReviewCard>
        ))}
      </ListSection>

      <ListSection title="Pending Actions" empty="Nothing pending.">
        {r.pending_actions.map((p, i) => (
          <ReviewCard key={i} cardKey={`pending-${i}`} title={`Action ${i + 1}`} reviews={reviews} setReview={setReview} defaultText={p.text} compact>
            <p className="text-sm text-foreground/90">{p.text}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {p.status}
              </span>
              <EvidenceChips ids={p.evidence} onClick={onEvidenceClick} />
            </div>
          </ReviewCard>
        ))}
      </ListSection>

      <ListSection title="Risk / Attention Flags" empty="No risks flagged.">
        {r.risk_flags.map((f, i) => (
          <ReviewCard key={i} cardKey={`risk-${i}`} title={`Flag ${i + 1}`} reviews={reviews} setReview={setReview} defaultText={f.text} compact
            accent={severityAccent(f.severity)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge s={f.severity} />
              <ConfidenceBadge c={f.confidence} />
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{f.text}</p>
            <p className="mt-1 text-xs text-muted-foreground italic">Rationale: {f.rationale}</p>
            <div className="mt-2">
              <EvidenceChips ids={f.evidence} onClick={onEvidenceClick} />
            </div>
          </ReviewCard>
        ))}
      </ListSection>

      <ReviewCard
        cardKey="next-action"
        title="Recommended Next Action"
        reviews={reviews}
        setReview={setReview}
        defaultText={r.recommended_next_action.text}
        dark
      >
        <p className="text-base font-medium leading-relaxed">{r.recommended_next_action.text}</p>
        <p className="mt-2 text-xs italic opacity-80">Rationale: {r.recommended_next_action.rationale}</p>
        <div className="mt-3">
          <EvidenceChips ids={r.recommended_next_action.evidence} onClick={onEvidenceClick} dark />
        </div>
      </ReviewCard>

      <details className="rounded-xl border border-border bg-card p-4 text-sm">
        <summary className="cursor-pointer font-semibold">View extraction prompt & raw JSON</summary>
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompt</div>
            <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap">{result.prompt}</pre>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Raw JSON</div>
            <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap">{result.raw}</pre>
          </div>
        </div>
      </details>
    </section>
  );
}

function severityAccent(s: "low" | "medium" | "high"): string {
  if (s === "high") return "border-l-4 border-l-red-500";
  if (s === "medium") return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-emerald-500";
}

function SeverityBadge({ s }: { s: "low" | "medium" | "high" }) {
  const cls =
    s === "high"
      ? "bg-red-100 text-red-800 border-red-300"
      : s === "medium"
        ? "bg-amber-100 text-amber-900 border-amber-300"
        : "bg-emerald-100 text-emerald-800 border-emerald-300";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {s} risk
    </span>
  );
}

function ConfidenceBadge({ c }: { c: Confidence }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CONFIDENCE_CLASS[c]}`}>
      {CONFIDENCE_LABEL[c]}
    </span>
  );
}

function EvidenceChips({ ids, onClick, dark = false }: { ids: string[]; onClick: (id: string) => void; dark?: boolean }) {
  if (!ids || ids.length === 0) {
    return <span className="text-[11px] italic text-muted-foreground">no evidence</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <button
          key={id}
          onClick={() => onClick(id)}
          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold transition ${
            dark
              ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
              : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          {id}
        </button>
      ))}
    </div>
  );
}

function DimensionCard({
  k,
  label,
  d,
  reviews,
  setReview,
  onEvidenceClick,
}: {
  k: string;
  label: string;
  d: { status: string; confidence: Confidence; evidence: string[] };
  reviews: Record<string, ReviewState>;
  setReview: (key: string, state: ReviewState) => void;
  onEvidenceClick: (id: string) => void;
}) {
  return (
    <ReviewCard cardKey={`dim-${k}`} title={label} reviews={reviews} setReview={setReview} defaultText={d.status} compact>
      <div className="mb-2">
        <ConfidenceBadge c={d.confidence} />
      </div>
      <p className="text-sm text-foreground/90">{d.status}</p>
      <div className="mt-2">
        <EvidenceChips ids={d.evidence} onClick={onEvidenceClick} />
      </div>
    </ReviewCard>
  );
}

function ReviewCard({
  cardKey,
  title,
  children,
  reviews,
  setReview,
  defaultText,
  compact = false,
  dark = false,
  accent = "",
}: {
  cardKey: string;
  title: string;
  children: ReactNode;
  reviews: Record<string, ReviewState>;
  setReview: (key: string, state: ReviewState) => void;
  defaultText: string;
  compact?: boolean;
  dark?: boolean;
  accent?: string;
}) {
  const review = reviews[cardKey];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(review?.edited_text ?? defaultText);

  const isRejected = review?.action === "rejected";
  const isApproved = review?.action === "approved";
  const isEdited = review?.action === "edited";

  const base = dark
    ? "bg-neutral-900 text-neutral-100 border-neutral-800"
    : "bg-card text-card-foreground border-border";

  return (
    <div
      className={`rounded-xl border ${base} ${accent} p-4 shadow-sm transition ${
        isRejected ? "opacity-40 grayscale" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className={`text-sm font-semibold tracking-tight ${dark ? "text-white" : ""} ${compact ? "" : "text-base"}`}>
          {title}
        </h3>
        <div className="flex items-center gap-1.5">
          {isApproved && <StateTag label="Approved" tone="green" dark={dark} />}
          {isEdited && <StateTag label="Edited" tone="blue" dark={dark} />}
          {isRejected && <StateTag label="Dismissed" tone="grey" dark={dark} />}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-24 w-full rounded-md border border-input bg-background p-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="text-[11px] text-muted-foreground">
            Original AI output is preserved for audit.
          </div>
        </div>
      ) : isEdited && review?.edited_text ? (
        <div className="space-y-2">
          <p className={`text-sm ${dark ? "text-neutral-100" : "text-foreground/90"}`}>{review.edited_text}</p>
          <details className={`text-xs ${dark ? "text-neutral-400" : "text-muted-foreground"}`}>
            <summary className="cursor-pointer">show original</summary>
            <div className={`mt-1 rounded p-2 text-xs ${dark ? "bg-neutral-800" : "bg-muted"}`}>{defaultText}</div>
          </details>
          {children}
        </div>
      ) : (
        children
      )}

      <div className={`mt-3 flex flex-wrap gap-2 border-t pt-3 text-xs ${dark ? "border-neutral-800" : "border-border"}`}>
        {editing ? (
          <>
            <ActionBtn tone="primary" dark={dark} onClick={() => { setReview(cardKey, { action: "edited", edited_text: draft }); setEditing(false); }}>Save edit</ActionBtn>
            <ActionBtn tone="ghost" dark={dark} onClick={() => { setDraft(review?.edited_text ?? defaultText); setEditing(false); }}>Cancel</ActionBtn>
          </>
        ) : (
          <>
            <ActionBtn tone="approve" dark={dark} onClick={() => setReview(cardKey, { action: "approved", edited_text: null })}>Approve</ActionBtn>
            <ActionBtn tone="edit" dark={dark} onClick={() => { setDraft(review?.edited_text ?? defaultText); setEditing(true); }}>Edit</ActionBtn>
            <ActionBtn tone="reject" dark={dark} onClick={() => setReview(cardKey, { action: "rejected", edited_text: null })}>Reject</ActionBtn>
            {review?.action && (
              <button
                onClick={() => setReview(cardKey, { action: null, edited_text: null })}
                className={`ml-auto text-[11px] underline underline-offset-2 ${dark ? "text-neutral-400" : "text-muted-foreground"}`}
              >
                clear
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ tone, dark, onClick, children }: { tone: "approve" | "edit" | "reject" | "primary" | "ghost"; dark?: boolean; onClick: () => void; children: ReactNode }) {
  const map: Record<string, string> = {
    approve: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    edit: "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100",
    reject: "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100",
    primary: "border-primary bg-primary text-primary-foreground hover:brightness-110",
    ghost: "border-border bg-background hover:bg-muted",
  };
  const darkMap: Record<string, string> = {
    approve: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25",
    edit: "border-sky-500/40 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25",
    reject: "border-rose-500/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25",
    primary: "border-white/40 bg-white text-neutral-900 hover:bg-white/90",
    ghost: "border-white/20 bg-transparent text-white hover:bg-white/10",
  };
  const cls = dark ? darkMap[tone] : map[tone];
  return (
    <button onClick={onClick} className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${cls}`}>
      {children}
    </button>
  );
}

function StateTag({ label, tone, dark }: { label: string; tone: "green" | "blue" | "grey"; dark?: boolean }) {
  const map: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-300",
    blue: "bg-sky-100 text-sky-800 border-sky-300",
    grey: "bg-neutral-200 text-neutral-600 border-neutral-300",
  };
  const darkMap: Record<string, string> = {
    green: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
    blue: "bg-sky-500/20 text-sky-200 border-sky-500/40",
    grey: "bg-white/10 text-neutral-300 border-white/20",
  };
  const cls = dark ? darkMap[tone] : map[tone];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function ListSection({ title, children, empty }: { title: string; children: ReactNode; empty: string }) {
  const kids = Array.isArray(children) ? children : [children];
  const isEmpty = kids.filter(Boolean).length === 0;
  return (
    <div>
      <h2 className="mb-2 font-serif text-lg font-medium tracking-tight">{title}</h2>
      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-3 text-xs italic text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="grid h-[60vh] place-items-center rounded-xl border border-dashed border-border bg-card/60">
      <div className="text-center">
        <div className="font-serif text-2xl">{title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-900">
      <div className="mb-1 text-base font-semibold">Analysis failed</div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">{message}</pre>
    </section>
  );
}