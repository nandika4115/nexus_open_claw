import path from "path";
import { atomicWriteFile, readFileIfExists } from "../utils/fs-utils.js";
export class HeartbeatStateStore {
    filePath;
    constructor(memoryPath) {
        this.filePath = path.join(memoryPath, "_heartbeat.json");
    }
    async load() {
        const raw = await readFileIfExists(this.filePath);
        if (!raw) {
            return {};
        }
        return JSON.parse(raw);
    }
    async save(state) {
        await atomicWriteFile(this.filePath, JSON.stringify(state, null, 2));
    }
}
