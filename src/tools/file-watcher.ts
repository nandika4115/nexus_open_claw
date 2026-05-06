import { EventEmitter } from "events";

import chokidar from "chokidar";

export interface FileChangeEvent {
  path: string;
  modifiedAt: string;
}

export interface FileWatcherConfig {
  watchPaths: string[];
  extensions: string[];
  ignorePatterns?: string[];
  debounceMs: number;
}

export class FileWatcher extends EventEmitter {
  private watcher?: chokidar.FSWatcher;
  private readonly config: FileWatcherConfig;
  private readonly events: FileChangeEvent[] = [];

  constructor(config: FileWatcherConfig) {
    super();
    this.config = config;
  }

  start(): void {
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
      const event: FileChangeEvent = {
        path: filePath,
        modifiedAt: new Date().toISOString()
      };
      this.events.push(event);
      this.emit("change", event);
    });
  }

  stop(): Promise<void> {
    return this.watcher?.close() ?? Promise.resolve();
  }

  drainEvents(sinceIso?: string): FileChangeEvent[] {
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
