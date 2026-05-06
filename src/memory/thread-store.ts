import path from "path";

import type { Logger } from "winston";

import type { SourcesFile, Thread } from "./schema.js";
import { SourcesFileSchema } from "./schema.js";
import { atomicWriteFile, readFileIfExists } from "../utils/fs-utils.js";
import { withFileLock } from "../utils/lock.js";
import { readYamlFile, writeYamlFile } from "../utils/yaml-utils.js";

export class ThreadStore {
  private readonly threadsPath: string;
  private readonly logger: Logger;

  constructor(memoryPath: string, logger: Logger) {
    this.threadsPath = path.join(memoryPath, "threads");
    this.logger = logger;
  }

  threadDir(slug: string): string {
    return path.join(this.threadsPath, slug);
  }

  threadFile(slug: string, fileName: string): string {
    return path.join(this.threadDir(slug), fileName);
  }

  async readThreadMarkdown(slug: string): Promise<string | null> {
    return readFileIfExists(this.threadFile(slug, "thread.md"));
  }

  async writeThreadMarkdown(slug: string, contents: string): Promise<void> {
    const filePath = this.threadFile(slug, "thread.md");
    await withFileLock(filePath, () => atomicWriteFile(filePath, contents));
  }

  async readInsights(slug: string): Promise<string | null> {
    return readFileIfExists(this.threadFile(slug, "insights.md"));
  }

  async readQuestions(slug: string): Promise<string | null> {
    return readFileIfExists(this.threadFile(slug, "questions.md"));
  }

  async writeSessionSnapshot(slug: string, fileName: string, contents: string): Promise<void> {
    const filePath = this.threadFile(slug, path.join("sessions", fileName));
    await withFileLock(filePath, () => atomicWriteFile(filePath, contents));
  }

  async readSources(slug: string): Promise<SourcesFile> {
    const filePath = this.threadFile(slug, "sources.yaml");
    return readYamlFile(filePath, SourcesFileSchema);
  }

  async writeSources(slug: string, sources: SourcesFile): Promise<void> {
    const filePath = this.threadFile(slug, "sources.yaml");
    await withFileLock(filePath, () => writeYamlFile(filePath, sources));
  }

  async ensureThreadStructure(thread: Thread): Promise<void> {
    const baseDir = this.threadDir(thread.slug);
    await atomicWriteFile(path.join(baseDir, "thread.md"), "");
    await atomicWriteFile(path.join(baseDir, "insights.md"), "");
    await atomicWriteFile(path.join(baseDir, "questions.md"), "");
    await writeYamlFile(path.join(baseDir, "sources.yaml"), { sources: [] });
    this.logger.info("Thread structure ensured", { slug: thread.slug });
  }
}
