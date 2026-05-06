import path from "path";

import { atomicWriteFile, readFileIfExists } from "../utils/fs-utils.js";

export interface HeartbeatState {
  lastTickAt?: string;
  lastSchedules?: Record<string, string>;
}

export class HeartbeatStateStore {
  private readonly filePath: string;

  constructor(memoryPath: string) {
    this.filePath = path.join(memoryPath, "_heartbeat.json");
  }

  async load(): Promise<HeartbeatState> {
    const raw = await readFileIfExists(this.filePath);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as HeartbeatState;
  }

  async save(state: HeartbeatState): Promise<void> {
    await atomicWriteFile(this.filePath, JSON.stringify(state, null, 2));
  }
}
