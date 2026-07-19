import type { Message } from "./report-types";

export function parseTranscript(raw: string): Message[] {
  const messages: Message[] = [];
  const counters: Record<string, number> = {};
  const lines = raw.split(/\r?\n/);

  let currentDay = "D1"; // default fallback day

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line is a day indicator on its own line: e.g., "Day 1" or "D1"
    const dayHeaderMatch = trimmed.match(/^(?:Day|D)\s*(\d+)$/i);
    if (dayHeaderMatch) {
      currentDay = `D${dayHeaderMatch[1]}`;
      continue;
    }

    // Check for inline format: e.g. "D1 | Client: message"
    const inlineMatch = trimmed.match(/^(D\d+)\s*\|\s*([^:]+?):\s*(.*)$/);
    if (inlineMatch) {
      const day = inlineMatch[1];
      const sender = inlineMatch[2].trim();
      const text = inlineMatch[3].trim();
      counters[day] = (counters[day] ?? 0) + 1;
      messages.push({ id: `${day}.${counters[day]}`, day, sender, text });
      currentDay = day; // Sync current day context
      continue;
    }

    // Check for standard format under active day context: e.g. "Client: message"
    const standardMatch = trimmed.match(/^([^:]+?):\s*(.*)$/);
    if (standardMatch) {
      const sender = standardMatch[1].trim();
      const text = standardMatch[2].trim();

      // If we have a valid sender (not just a URL or HTTP protocol)
      if (sender.toLowerCase() !== "http" && sender.toLowerCase() !== "https") {
        counters[currentDay] = (counters[currentDay] ?? 0) + 1;
        messages.push({
          id: `${currentDay}.${counters[currentDay]}`,
          day: currentDay,
          sender,
          text,
        });
        continue;
      }
    }
  }

  return messages;
}

export function formatForPrompt(messages: Message[]): string {
  return messages.map((m) => `[${m.id}] ${m.sender}: ${m.text}`).join("\n");
}
