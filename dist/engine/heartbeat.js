import { HeartbeatStateStore } from "./heartbeat-state.js";
import { nextOccurrence } from "./scheduler.js";
import { toIsoTimestamp } from "../utils/time.js";
export class HeartbeatDaemon {
    logger;
    config;
    stateStore;
    tickTimer;
    scheduleTimers = [];
    dispatch;
    constructor(logger, memoryPath, config, dispatch) {
        this.logger = logger;
        this.config = config;
        this.stateStore = new HeartbeatStateStore(memoryPath);
        this.dispatch = dispatch;
    }
    async start() {
        const state = await this.stateStore.load();
        this.logger.info("Heartbeat starting", { lastTickAt: state.lastTickAt });
        this.tickTimer = setInterval(() => void this.tick(), this.config.intervalMin * 60 * 1000);
        void this.tick();
        this.scheduleDailyEvents();
    }
    stop() {
        if (this.tickTimer) {
            clearInterval(this.tickTimer);
        }
        for (const timer of this.scheduleTimers) {
            clearTimeout(timer);
        }
        this.scheduleTimers = [];
    }
    async tick() {
        const timestamp = toIsoTimestamp();
        this.logger.info("Heartbeat tick", { timestamp });
        await this.dispatch({ type: "heartbeat_tick", timestamp });
        const state = await this.stateStore.load();
        await this.stateStore.save({
            ...state,
            lastTickAt: timestamp
        });
    }
    scheduleDailyEvents() {
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
