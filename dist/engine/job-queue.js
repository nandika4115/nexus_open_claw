export class JobQueue {
    queue = [];
    running = false;
    enqueue(job) {
        this.queue.push(job);
        void this.runNext();
    }
    async runNext() {
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
        }
        finally {
            this.running = false;
            if (this.queue.length > 0) {
                void this.runNext();
            }
        }
    }
}
