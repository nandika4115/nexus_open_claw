import path from "path";
import { IndexSchema } from "./schema.js";
import { withFileLock } from "../utils/lock.js";
import { readYamlFile, writeYamlFile } from "../utils/yaml-utils.js";
import { toIsoTimestamp } from "../utils/time.js";
export class IndexStore {
    indexPath;
    logger;
    constructor(memoryPath, logger) {
        this.indexPath = path.join(memoryPath, "_index.yaml");
        this.logger = logger;
    }
    async load() {
        return readYamlFile(this.indexPath, IndexSchema);
    }
    async save(index) {
        const updated = {
            ...index,
            last_updated: toIsoTimestamp()
        };
        await withFileLock(this.indexPath, () => writeYamlFile(this.indexPath, updated));
    }
    async updateThread(thread) {
        await withFileLock(this.indexPath, async () => {
            const index = await this.load();
            const threads = index.threads.map((item) => (item.id === thread.id ? thread : item));
            if (!threads.find((item) => item.id === thread.id)) {
                threads.push(thread);
            }
            await this.save({ ...index, threads });
            this.logger.info("Index thread updated", { threadId: thread.id });
        });
    }
    async listThreads() {
        const index = await this.load();
        return index.threads;
    }
    async findBySlug(slug) {
        const index = await this.load();
        return index.threads.find((thread) => thread.slug === slug);
    }
}
