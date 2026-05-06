export class JobQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  enqueue(job: () => Promise<void>): void {
    this.queue.push(job);
    void this.runNext();
  }

  private async runNext(): Promise<void> {
    if (this.running) {
      return;
    }
    const next = this.queue.shift();
    if (!next) {
      return;
    }
    this.running = true;
    try {
      await next();
    } finally {
      this.running = false;
      if (this.queue.length > 0) {
        void this.runNext();
      }
    }
  }
}
