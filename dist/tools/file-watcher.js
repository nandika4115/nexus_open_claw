import { EventEmitter } from "events";
import chokidar from "chokidar";
export class FileWatcher extends EventEmitter {
    watcher;
    config;
    events = [];
    constructor(config) {
        super();
        this.config = config;
    }
    start() {
        this.watcher = chokidar.watch(this.config.watchPaths, {
            ignored: this.config.ignorePatterns,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: this.config.debounceMs,
                pollInterval: 200
            }
        });
        this.watcher.on("change", (filePath) => {
            if (!this.config.extensions.some((ext) => filePath.endsWith(ext))) {
                return;
            }
            const event = {
                path: filePath,
                modifiedAt: new Date().toISOString()
            };
            this.events.push(event);
            this.emit("change", event);
        });
    }
    stop() {
        return this.watcher?.close() ?? Promise.resolve();
    }
    drainEvents(sinceIso) {
        if (!sinceIso) {
            const all = [...this.events];
            this.events.length = 0;
            return all;
        }
        const since = new Date(sinceIso).getTime();
        const filtered = this.events.filter((event) => new Date(event.modifiedAt).getTime() >= since);
        this.events.length = 0;
        return filtered;
    }
}
