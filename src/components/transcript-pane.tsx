import type { MutableRefObject } from "react";
import type { Message } from "@/lib/report-types";

interface Props {
  transcript: string;
  setTranscript: (v: string) => void;
  messages: Message[];
  onAnalyze: () => void;
  onLoadSample: () => void;
  isLoading: boolean;
  highlightId: string | null;
  messageRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
}

function senderClass(sender: string): string {
  const s = sender.toLowerCase();
  if (s.includes("accountability")) return "bg-purple-50 border-l-purple-400 text-purple-900";
  if (s.includes("coach")) return "bg-primary/5 border-l-primary text-foreground";
  return "bg-amber-50 border-l-amber-400 text-neutral-800";
}

export function TranscriptPane({
  transcript,
  setTranscript,
  messages,
  onAnalyze,
  onLoadSample,
  isLoading,
  highlightId,
  messageRefs,
}: Props) {
  return (
    <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)]">
      <div className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">Transcript</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Format: <code className="rounded bg-muted px-1">D1 | Sender: message</code>
          </p>
        </div>

        <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            spellCheck={false}
            className="h-32 w-full resize-none rounded-md border border-input bg-background p-2 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button
              onClick={onAnalyze}
              disabled={isLoading || !transcript.trim()}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-50"
            >
              {isLoading ? "Analyzing…" : "Analyze Week"}
            </button>
            <button
              onClick={onLoadSample}
              className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Load sample
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {messages.length} messages parsed
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {messages.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No messages parsed yet.</div>
          ) : (
            <div className="space-y-1.5">
              {messages.map((m) => {
                const isHi = highlightId === m.id;
                return (
                  <div
                    key={m.id}
                    ref={(el) => {
                      messageRefs.current[m.id] = el;
                    }}
                    className={`rounded-md border-l-4 px-2.5 py-1.5 text-xs transition-all ${senderClass(m.sender)} ${isHi ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                  >
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider opacity-70">
                      <span className="rounded bg-white/60 px-1 py-0.5 font-mono text-[10px] text-neutral-700">
                        {m.id}
                      </span>
                      <span>{m.sender}</span>
                    </div>
                    <div className="mt-0.5 leading-snug">{m.text}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}