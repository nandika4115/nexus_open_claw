import { ConnectionStore } from "./connection-store.js";
import { IndexStore } from "./index-store.js";
import { ThreadStore } from "./thread-store.js";
export function createMemoryStores(memoryPath, logger) {
    return {
        index: new IndexStore(memoryPath, logger),
        connections: new ConnectionStore(memoryPath, logger),
        threads: new ThreadStore(memoryPath, logger)
    };
}
