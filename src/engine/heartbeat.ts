import type { Logger } from "winston";

import { HeartbeatStateStore } from "./heartbeat-state.js";
import type { EngineSignal } from "./types.js";
import type { DailySchedule } from "./scheduler.js";
import { nextOccurrence } from "./scheduler.js";
import { toIsoTimestamp } from "../utils/time.js";

export interface HeartbeatConfig {
  intervalMin: number;
  dailySchedules: DailySchedule[];
}

export class HeartbeatDaemon {
  private readonly logger: Logger;
  private readonly config: HeartbeatConfig;
  private readonly stateStore: HeartbeatStateStore;
  private tickTimer?: NodeJS.Timeout;
  private scheduleTimers: NodeJS.Timeout[] = [];
  private readonly dispatch: (signal: EngineSignal) => Promise<void>;

  constructor(
    logger: Logger,
    memoryPath: string,
    config: HeartbeatConfig,
    dispatch: (signal: EngineSignal) => Promise<void>
  ) {
    this.logger = logger;
    this.config = config;
    this.stateStore = new HeartbeatStateStore(memoryPath);
    this.dispatch = dispatch;
  }

  async start(): Promise<void> {
    const state = await this.stateStore.load();
    this.logger.info("Heartbeat starting", { lastTickAt: state.lastTickAt });
    this.tickTimer = setInterval(() => void this.tick(), this.config.intervalMin * 60 * 1000);
    void this.tick();
    this.scheduleDailyEvents();
  }

  stop(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
    for (const timer of this.scheduleTimers) {
      clearTimeout(timer);
    }
    this.scheduleTimers = [];
  }

  private async tick(): Promise<void> {
    const timestamp = toIsoTimestamp();
    this.logger.info("Heartbeat tick", { timestamp });
    await this.dispatch({ type: "heartbeat_tick", timestamp });
    const state = await this.stateStore.load();
    await this.stateStore.save({
      ...state,
      lastTickAt: timestamp
    });
  }

  private scheduleDailyEvents(): void {
    for (const schedule of this.config.dailySchedules) {
      const next = nextOccurrence(schedule.time);
      const delay = next.getTime() - Date.now();
      const timer = setTimeout(() => {
        void this.dispatch({
          type: "daily_schedule",
          timestamp: toIsoTimestamp(),
          payload: { schedule: schedule.name }
        });
        this.scheduleDailyEvents();
      }, delay);
      this.scheduleTimers.push(timer);
      this.logger.info("Scheduled daily event", { schedule: schedule.name, at: next.toISOString() });
    }
  }
}
