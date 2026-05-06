import { JobQueue } from "./job-queue.js";
export class PiEngine {
    logger;
    planner;
    behaviors = new Map();
    queue = new JobQueue();
    constructor(logger, planner) {
        this.logger = logger;
        this.planner = planner;
    }
    registerBehavior(name, handler) {
        this.behaviors.set(name, { name, handler });
    }
    async handleSignal(signal) {
        this.queue.enqueue(async () => {
            this.logger.info("Engine received signal", { type: signal.type });
            const plan = this.planner.plan(signal, this.behaviors);
            await this.executePlan(signal, plan);
        });
    }
    async executePlan(signal, plan) {
        for (const behavior of plan) {
            try {
                this.logger.info("Executing behavior", { name: behavior.name, signal: signal.type });
                await behavior.handler({ signal });
            }
            catch (error) {
                this.logger.error("Behavior failed", {
                    name: behavior.name,
                    error: error.message
                });
            }
        }
    }
}
