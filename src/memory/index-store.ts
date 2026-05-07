import path from "path";

import type { Logger } from "winston";

import type { IndexFile, Thread } from "./schema.js";
import { IndexSchema } from "./schema.js";
import { withFileLock } from "../utils/lock.js";
import { readYamlFile, writeYamlFile } from "../utils/yaml-utils.js";
import { toIsoTimestamp } from "../utils/time.js";

export class IndexStore {
  private readonly indexPath: string;
  private readonly logger: Logger;

  constructor(memoryPath: string, logger: Logger) {
    this.indexPath = path.join(memoryPath, "_index.yaml");
    this.logger = logger;
  }

  async load(): Promise<IndexFile> {
    return readYamlFile(this.indexPath, IndexSchema);
  }

  async save(index: IndexFile): Promise<void> {
    const updated: IndexFile = {
      ...index,
      last_updated: toIsoTimestamp()
    };
    await withFileLock(this.indexPath, () => writeYamlFile(this.indexPath, updated));
  }

  async updateThread(thread: Thread): Promise<void> {
    await withFileLock(this.indexPath, async () => {
      const index = await this.load();
      const threads = index.threads.map((item) => (item.id === thread.id ? thread : item));
      if (!threads.find((item) => item.id === thread.id)) {
        threads.push(thread);
      }
      await writeYamlFile(this.indexPath, { ...index, threads, last_updated: toIsoTimestamp() });
      this.logger.info("Index thread updated", { threadId: thread.id });
    });
  }

  async listThreads(): Promise<Thread[]> {
    const index = await this.load();
    return index.threads;
  }

  async findBySlug(slug: string): Promise<Thread | undefined> {
    const index = await this.load();
    return index.threads.find((thread) => thread.slug === slug);
  }
}
