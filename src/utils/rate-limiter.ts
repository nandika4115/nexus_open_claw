export class RateLimiter {
  private readonly minIntervalMs: number;
  private lastRun = 0;

  constructor(minIntervalMs: number) {
    this.minIntervalMs = minIntervalMs;
  }

  async schedule(): Promise<void> {
    const now = Date.now();
    const wait = Math.max(0, this.minIntervalMs - (now - this.lastRun));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastRun = Date.now();
  }
}
