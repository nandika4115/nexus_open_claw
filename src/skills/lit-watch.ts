import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import type { PlannedBehavior } from "../engine/types.js";
import type { Source } from "../memory/schema.js";
import { formatDateStamp, toIsoTimestamp } from "../utils/time.js";
import type { SkillServices } from "./context.js";

export function createLitWatchBehavior(services: SkillServices): PlannedBehavior {
  return {
    name: "lit_watch",
    handler: async () => {
      const { memory, tools, logger, config } = services;
      if (!tools.arxiv && !tools.core && !tools.semanticScholar) {
        logger.warn("Lit watch skipped: tools not configured");
        return;
      }

      const threshold = config.runtimeConfig?.behaviors.lit_watch.relevance_threshold ?? 0.6;
      const threads = await memory.index.listThreads();
      const watchThreads = threads.filter((thread) => thread.watch_sources.length > 0);

      for (const thread of watchThreads) {
        const results: Array<{ title: string; abstract?: string; url: string; authors: string[] }> = [];

        if (tools.arxiv && thread.watch_sources.includes("arxiv")) {
          try {
            const arxivResults = await tools.arxiv.searchByKeywords(thread.topic_keywords, 10);
            for (const result of arxivResults) {
              results.push({
                title: result.title,
                abstract: result.summary,
                url: result.id,
                authors: result.authors
              });
            }
          } catch (error) {
            logger.warn("Lit watch provider failed", {
              thread: thread.slug,
              provider: "arxiv",
              error: (error as Error).message
            });
          }
        }

        if (tools.core && thread.watch_sources.includes("core")) {
          try {
            const query = thread.topic_keywords.join(" ");
            const coreResults = await tools.core.search(query, 10);
            for (const result of coreResults) {
              results.push({
                title: result.title,
                abstract: result.abstract,
                url: result.url,
                authors: result.authors
              });
            }
          } catch (error) {
            logger.warn("Lit watch provider failed", {
              thread: thread.slug,
              provider: "core",
              error: (error as Error).message
            });
          }
        }

        if (tools.semanticScholar && thread.watch_sources.includes("semantic_scholar")) {
          try {
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
          } catch (error) {
            logger.warn("Lit watch provider failed", {
              thread: thread.slug,
              provider: "semantic_scholar",
              error: (error as Error).message
            });
          }
        }

        const sources = await memory.threads.readSources(thread.slug);
        const knownUrls = new Set(sources.sources.map((source) => source.url));

        const newSources: Source[] = [];
        for (const result of results) {
          if (knownUrls.has(result.url)) {
            continue;
          }
          const relevanceScore = tools.llm
            ? Number(
                (await tools.llm.generate({
                  promptName: "relevance-score",
                  variables: {
                    threadTitle: thread.title,
                    paperTitle: result.title
                  },
                  contextChunks: [result.abstract ?? ""]
                }))
              )
            : threshold;

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
          await memory.index.updateThread({
            ...thread,
            source_count: sources.sources.length,
            last_touched: toIsoTimestamp()
          });
        }

        const watchPath = path.join(
          config.memoryPath,
          "threads",
          thread.slug,
          `lit-watch-${formatDateStamp()}.json`
        );
        await fs.writeFile(watchPath, JSON.stringify(results, null, 2), "utf8");

        logger.info("Lit watch complete", { thread: thread.slug, newSources: newSources.length });
      }
    }
  };
}
