import type { Message } from "./report-types";

export function parseTranscript(raw: string): Message[] {
  const messages: Message[] = [];
  const counters: Record<string, number> = {};
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(D\d+)\s*\|\s*([^:]+?):\s*(.*)$/);
    if (!m) continue;
    const day = m[1];
    const sender = m[2].trim();
    const text = m[3].trim();
    counters[day] = (counters[day] ?? 0) + 1;
    messages.push({ id: `${day}.${counters[day]}`, day, sender, text });
  }
  return messages;
}

export function formatForPrompt(messages: Message[]): string {
  return messages.map((m) => `[${m.id}] ${m.sender}: ${m.text}`).join("\n");
}