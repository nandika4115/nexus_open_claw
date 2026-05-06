import os from "os";
import path from "path";
import { loadEnvConfig } from "./env.js";
import { loadRuntimeConfig } from "./runtime.js";
import { expandHome } from "../utils/fs-utils.js";
export async function loadConfig() {
    const env = loadEnvConfig(process.env);
    const memoryPath = expandHome(env.NEXUS_MEMORY_PATH ?? path.join(os.homedir(), ".nexus", "memory"));
    const heartbeatIntervalMin = Number(env.NEXUS_HEARTBEAT_INTERVAL_MIN ?? "30");
    const morningBriefingTime = env.NEXUS_MORNING_BRIEFING_TIME ?? "08:30";
    const litWatchTime = env.NEXUS_LIT_WATCH_TIME ?? "06:00";
    const connectionEngineTime = env.NEXUS_CONNECTION_ENGINE_TIME ?? "23:00";
    const dormancyThresholdHours = Number(env.NEXUS_DORMANCY_THRESHOLD_HOURS ?? "72");
    const logLevel = env.NEXUS_LOG_LEVEL ?? "info";
    const logPath = env.NEXUS_LOG_PATH ? expandHome(env.NEXUS_LOG_PATH) : undefined;
    const browserExtPort = Number(env.BROWSER_EXT_PORT ?? "9001");
    let runtimeConfig;
    try {
        runtimeConfig = await loadRuntimeConfig(path.join(memoryPath, "_config.yaml"));
    }
    catch (error) {
        runtimeConfig = undefined;
    }
    return {
        env,
        memoryPath,
        heartbeatIntervalMin,
        morningBriefingTime,
        litWatchTime,
        connectionEngineTime,
        dormancyThresholdHours,
        logLevel,
        logPath,
        browserExtPort,
        runtimeConfig
    };
}
