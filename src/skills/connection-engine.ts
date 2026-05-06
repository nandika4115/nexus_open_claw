import { randomUUID } from "crypto";

import type { PlannedBehavior } from "../engine/types.js";
import type { Connection } from "../memory/schema.js";
import { toIsoTimestamp } from "../utils/time.js";
import type { SkillServices } from "./context.js";

export function createConnectionEngineBehavior(services: SkillServices): PlannedBehavior {
  return {
    name: "connection_engine",
    handler: async () => {
      const { memory, tools, logger, config } = services;
      const threshold =
        config.runtimeConfig?.behaviors.connection_engine.similarity_threshold ?? 0.75;

      const threads = await memory.index.listThreads();
      const existing = await memory.connections.load();
      const existingPairs = new Set(
        existing.connections.map((conn) => `${conn.from_thread}:${conn.to_thread}`)
      );

      for (let i = 0; i < threads.length; i += 1) {
        const a = threads[i];
        if (!a) {
          continue;
        }
        for (let j = i + 1; j < threads.length; j += 1) {
          const b = threads[j];
          if (!b) {
            continue;
          }
          const key = `${a.slug}:${b.slug}`;
          if (existingPairs.has(key)) {
            continue;
          }
          const insightsA = (await memory.threads.readInsights(a.slug)) ?? "";
          const insightsB = (await memory.threads.readInsights(b.slug)) ?? "";

          const keywordOverlap = a.topic_keywords.filter((keyword) =>
            b.topic_keywords.map((item) => item.toLowerCase()).includes(keyword.toLowerCase())
          );
          const keywordScore = Math.min(0.3, keywordOverlap.length * 0.1);

          let semanticScore = 0;
          let sharedConcepts: string[] = keywordOverlap;

          if (tools.llm) {
            const response = await tools.llm.generate({
              promptName: "connection-description",
              variables: {
                threadA: a.title,
                threadB: b.title
              },
              contextChunks: [insightsA, insightsB]
            });
            const scoreMatch = response.match(/score\s*[:=]\s*([0-9.]+)/i);
            if (scoreMatch) {
              semanticScore = Math.min(0.3, Number(scoreMatch[1]));
            }
            const conceptMatches = response.match(/concepts\s*[:=]\s*(.+)/i);
            const concepts = conceptMatches?.[1];
            if (concepts) {
              sharedConcepts = concepts
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
            }
          }

          const totalScore = Math.min(1, keywordScore + semanticScore);
          if (totalScore < threshold) {
            continue;
          }

          const connection: Connection = {
            id: randomUUID(),
            from_thread: a.slug,
            to_thread: b.slug,
            strength: totalScore,
            basis: keywordScore > 0 ? "keyword_match" : "citation_overlap",
            shared_concepts: sharedConcepts,
            discovered_at: toIsoTimestamp(),
            surfaced_to_user: false
          };

          await memory.connections.addConnection(connection);
          logger.info("Connection discovered", { from: a.slug, to: b.slug, score: totalScore });
        }
      }
    }
  };
}
