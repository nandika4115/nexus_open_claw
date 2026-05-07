import clipboardy from "clipboardy";

export interface ClipboardEntry {
  content: string;
  timestamp: string;
}

export class ClipboardMonitor {
  private readonly pollIntervalMs: number;
  private timer?: NodeJS.Timeout;
  private readonly entries: ClipboardEntry[] = [];
  private lastContent = "";
  private disabled = false;

  constructor(pollIntervalMs = 10000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  start(): void {
    this.timer = setInterval(() => void this.poll(), this.pollIntervalMs);
    void this.poll();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  drainEntries(sinceIso?: string): ClipboardEntry[] {
    if (!sinceIso) {
      const all = [...this.entries];
      this.entries.length = 0;
      return all;
    }
    const since = new Date(sinceIso).getTime();
    const filtered = this.entries.filter((entry) => new Date(entry.timestamp).getTime() >= since);
    this.entries.length = 0;
    return filtered;
  }

  private async poll(): Promise<void> {
    if (this.disabled) {
      return;
    }

    let content: string;
    try {
      content = await clipboardy.read();
    } catch {
      this.disabled = true;
      return;
    }

    if (content.length < 50) {
      return;
    }
    if (content === this.lastContent) {
      return;
    }
    this.lastContent = content;
    this.entries.push({ content, timestamp: new Date().toISOString() });
  }
}
