import type { Logger } from "winston";

import { ConnectionStore } from "./connection-store.js";
import { IndexStore } from "./index-store.js";
import { ThreadStore } from "./thread-store.js";

export interface MemoryStores {
  index: IndexStore;
  connections: ConnectionStore;
  threads: ThreadStore;
}

export function createMemoryStores(memoryPath: string, logger: Logger): MemoryStores {
  return {
    index: new IndexStore(memoryPath, logger),
    connections: new ConnectionStore(memoryPath, logger),
    threads: new ThreadStore(memoryPath, logger)
  };
}
