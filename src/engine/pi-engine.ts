import type { Logger } from "winston";

import type { EngineSignal, PlannedBehavior } from "./types.js";
import { JobQueue } from "./job-queue.js";
import { Planner } from "./planner.js";

export class PiEngine {
  private readonly logger: Logger;
  private readonly planner: Planner;
  private readonly behaviors = new Map<string, PlannedBehavior>();
  private readonly queue = new JobQueue();

  constructor(logger: Logger, planner: Planner) {
    this.logger = logger;
    this.planner = planner;
  }

  registerBehavior(name: string, handler: PlannedBehavior["handler"]): void {
    this.behaviors.set(name, { name, handler });
  }

  async handleSignal(signal: EngineSignal): Promise<void> {
    this.queue.enqueue(async () => {
      this.logger.info("Engine received signal", { type: signal.type });
      const plan = this.planner.plan(signal, this.behaviors);
      await this.executePlan(signal, plan);
    });
  }

  private async executePlan(signal: EngineSignal, plan: PlannedBehavior[]): Promise<void> {
    for (const behavior of plan) {
      try {
        this.logger.info("Executing behavior", { name: behavior.name, signal: signal.type });
        await behavior.handler({ signal });
      } catch (error) {
        this.logger.error("Behavior failed", {
          name: behavior.name,
          error: (error as Error).message
        });
      }
    }
  }
}
