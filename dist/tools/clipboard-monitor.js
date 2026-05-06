import clipboardy from "clipboardy";
export class ClipboardMonitor {
    pollIntervalMs;
    timer;
    entries = [];
    lastContent = "";
    constructor(pollIntervalMs = 10000) {
        this.pollIntervalMs = pollIntervalMs;
    }
    start() {
        this.timer = setInterval(() => void this.poll(), this.pollIntervalMs);
        void this.poll();
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    drainEntries(sinceIso) {
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
    async poll() {
        const content = await clipboardy.read();
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
