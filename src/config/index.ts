import os from "os";
import path from "path";

import { loadEnvConfig } from "./env.js";
import type { RuntimeConfig } from "./runtime.js";
import { loadRuntimeConfig } from "./runtime.js";
import { expandHome } from "../utils/fs-utils.js";

export interface AppConfig {
  env: ReturnType<typeof loadEnvConfig>;
  memoryPath: string;
  heartbeatIntervalMin: number;
  morningBriefingTime: string;
  litWatchTime: string;
  connectionEngineTime: string;
  dormancyThresholdHours: number;
  logLevel: "debug" | "info" | "warn" | "error";
  logPath?: string;
  browserExtPort: number;
  runtimeConfig?: RuntimeConfig;
}

export async function loadConfig(): Promise<AppConfig> {
  const env = loadEnvConfig(process.env);
  const memoryPath = expandHome(env.MNEMOCHRON_MEMORY_PATH ?? path.join(os.homedir(), ".mnemochron", "memory"));
  const heartbeatIntervalMin = Number(env.MNEMOCHRON_HEARTBEAT_INTERVAL_MIN ?? "30");
  const morningBriefingTime = env.MNEMOCHRON_MORNING_BRIEFING_TIME ?? "08:30";
  const litWatchTime = env.MNEMOCHRON_LIT_WATCH_TIME ?? "06:00";
  const connectionEngineTime = env.MNEMOCHRON_CONNECTION_ENGINE_TIME ?? "23:00";
  const dormancyThresholdHours = Number(env.MNEMOCHRON_DORMANCY_THRESHOLD_HOURS ?? "72");
  const logLevel = env.MNEMOCHRON_LOG_LEVEL ?? "info";
  const logPath = env.MNEMOCHRON_LOG_PATH ? expandHome(env.MNEMOCHRON_LOG_PATH) : undefined;
  const browserExtPort = Number(env.BROWSER_EXT_PORT ?? "9001");

  let runtimeConfig: RuntimeConfig | undefined;
  try {
    runtimeConfig = await loadRuntimeConfig(path.join(memoryPath, "_config.yaml"));
  } catch (error) {
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
