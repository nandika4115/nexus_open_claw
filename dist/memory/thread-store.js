import path from "path";
import { SourcesFileSchema } from "./schema.js";
import { atomicWriteFile, readFileIfExists } from "../utils/fs-utils.js";
import { withFileLock } from "../utils/lock.js";
import { readYamlFile, writeYamlFile } from "../utils/yaml-utils.js";
export class ThreadStore {
    threadsPath;
    logger;
    constructor(memoryPath, logger) {
        this.threadsPath = path.join(memoryPath, "threads");
        this.logger = logger;
    }
    threadDir(slug) {
        return path.join(this.threadsPath, slug);
    }
    threadFile(slug, fileName) {
        return path.join(this.threadDir(slug), fileName);
    }
    async readThreadMarkdown(slug) {
        return readFileIfExists(this.threadFile(slug, "thread.md"));
    }
    async writeThreadMarkdown(slug, contents) {
        const filePath = this.threadFile(slug, "thread.md");
        await withFileLock(filePath, () => atomicWriteFile(filePath, contents));
    }
    async readInsights(slug) {
        return readFileIfExists(this.threadFile(slug, "insights.md"));
    }
    async readQuestions(slug) {
        return readFileIfExists(this.threadFile(slug, "questions.md"));
    }
    async writeSessionSnapshot(slug, fileName, contents) {
        const filePath = this.threadFile(slug, path.join("sessions", fileName));
        await withFileLock(filePath, () => atomicWriteFile(filePath, contents));
    }
    async readSources(slug) {
        const filePath = this.threadFile(slug, "sources.yaml");
        return readYamlFile(filePath, SourcesFileSchema);
    }
    async writeSources(slug, sources) {
        const filePath = this.threadFile(slug, "sources.yaml");
        await withFileLock(filePath, () => writeYamlFile(filePath, sources));
    }
    async ensureThreadStructure(thread) {
        const baseDir = this.threadDir(thread.slug);
        await atomicWriteFile(path.join(baseDir, "thread.md"), "");
        await atomicWriteFile(path.join(baseDir, "insights.md"), "");
        await atomicWriteFile(path.join(baseDir, "questions.md"), "");
        await writeYamlFile(path.join(baseDir, "sources.yaml"), { sources: [] });
        this.logger.info("Thread structure ensured", { slug: thread.slug });
    }
}
