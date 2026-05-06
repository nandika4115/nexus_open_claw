import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { formatDateStamp, toIsoTimestamp } from "../utils/time.js";
export function createLitWatchBehavior(services) {
    return {
        name: "lit_watch",
        handler: async () => {
            const { memory, tools, logger, config } = services;
            if (!tools.arxiv && !tools.semanticScholar) {
                logger.warn("Lit watch skipped: tools not configured");
                return;
            }
            const threshold = config.runtimeConfig?.behaviors.lit_watch.relevance_threshold ?? 0.6;
            const threads = await memory.index.listThreads();
            const watchThreads = threads.filter((thread) => thread.watch_sources.length > 0);
            for (const thread of watchThreads) {
                const results = [];
                if (tools.arxiv && thread.watch_sources.includes("arxiv")) {
                    const arxivResults = await tools.arxiv.searchByKeywords(thread.topic_keywords, 10);
                    for (const result of arxivResults) {
                        results.push({
                            title: result.title,
                            abstract: result.summary,
                            url: result.id,
                            authors: result.authors
                        });
                    }
                }
                if (tools.semanticScholar && thread.watch_sources.includes("semantic_scholar")) {
                    const query = thread.topic_keywords.join(" ");
                    const scholarResults = await tools.semanticScholar.search(query, 10);
                    for (const result of scholarResults) {
                        results.push({
                            title: result.title,
                            abstract: result.abstract,
                            url: `https://www.semanticscholar.org/paper/${result.id}`,
                            authors: result.authors
                        });
                    }
                }
                const sources = await memory.threads.readSources(thread.slug);
                const knownUrls = new Set(sources.sources.map((source) => source.url));
                const newSources = [];
                for (const result of results) {
                    if (knownUrls.has(result.url)) {
                        continue;
                    }
                    const relevanceScore = tools.llm
                        ? Number((await tools.llm.generate({
                            promptName: "relevance-score",
                            variables: {
                                threadTitle: thread.title,
                                paperTitle: result.title
                            },
                            contextChunks: [result.abstract ?? ""]
                        })))
                        : 0.5;
                    if (Number.isNaN(relevanceScore) || relevanceScore < threshold) {
                        continue;
                    }
                    newSources.push({
                        id: randomUUID(),
                        url: result.url,
                        title: result.title,
                        authors: result.authors,
                        added_at: toIsoTimestamp(),
                        reading_progress: 0,
                        tags: [],
                        citation_overlap: [],
                        status: "new_unread"
                    });
                }
                if (newSources.length > 0) {
                    sources.sources.push(...newSources);
                    await memory.threads.writeSources(thread.slug, sources);
                }
                const watchPath = path.join(config.memoryPath, "threads", thread.slug, `lit-watch-${formatDateStamp()}.json`);
                await fs.writeFile(watchPath, JSON.stringify(results, null, 2), "utf8");
                logger.info("Lit watch complete", { thread: thread.slug, newSources: newSources.length });
            }
        }
    };
}
