export class Planner {
    runtimeConfig;
    constructor(runtimeConfig) {
        this.runtimeConfig = runtimeConfig;
    }
    plan(signal, registry) {
        const enabled = this.runtimeConfig?.behaviors;
        if (signal.type === "heartbeat_tick") {
            const snapshot = registry.get("session_snapshot");
            if (snapshot && enabled?.session_snapshot.enabled !== false) {
                return [snapshot];
            }
            return [];
        }
        if (signal.type === "daily_schedule") {
            const scheduleType = String(signal.payload?.schedule);
            if (scheduleType === "connection_engine") {
                const behavior = registry.get("connection_engine");
                if (behavior && enabled?.connection_engine.enabled !== false) {
                    return [behavior];
                }
            }
            if (scheduleType === "morning_briefing") {
                const behavior = registry.get("morning_briefing");
                if (behavior && enabled?.morning_briefing.enabled !== false) {
                    return [behavior];
                }
            }
            if (scheduleType === "lit_watch") {
                const behavior = registry.get("lit_watch");
                if (behavior && enabled?.lit_watch.enabled !== false) {
                    return [behavior];
                }
            }
            return [];
        }
        return [];
    }
}
