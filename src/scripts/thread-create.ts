import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import path from "path";

import { loadConfig } from "../config/index.js";
import { createLogger } from "../utils/logger.js";
import { createMemoryStores } from "../memory/index.js";
import { toIsoTimestamp } from "../utils/time.js";
import type { Thread } from "../memory/schema.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const logger = createLogger({ level: config.logLevel, logPath: config.logPath });
  const memory = createMemoryStores(config.memoryPath, logger);

  const rl = readline.createInterface({ input, output });
  const title = await rl.question("Thread title: ");
  const keywordsRaw = await rl.question("Topic keywords (comma-separated): ");
  const priority = await rl.question("Priority (high/medium/low): ");
  const watch = await rl.question("Enable lit watch? (y/n): ");
  const dormancyRaw = await rl.question("Dormancy threshold (hours): ");
  await rl.close();

  const slug = title.toLowerCase().replace(/\s+/g, "-");
  const watchSources: Thread["watch_sources"] = watch.toLowerCase().startsWith("y")
    ? config.env.SEMANTIC_SCHOLAR_API_KEY
      ? ["arxiv", "core", "semantic_scholar"]
      : ["arxiv", "core"]
    : [];
  const thread: Thread = {
    id: slug,
    slug,
    title,
    status: "active",
    priority: priority === "high" ? "high" : priority === "low" ? "low" : "medium",
    created_at: toIsoTimestamp(),
    last_touched: toIsoTimestamp(),
    last_snapshot: toIsoTimestamp(),
    topic_keywords: keywordsRaw.split(",").map((item) => item.trim()),
    source_count: 0,
    insight_count: 0,
    connection_count: 0,
    dormancy_threshold_hours: Number(dormancyRaw) || 72,
    watch_sources: watchSources
  };

  await memory.index.updateThread(thread);
  await memory.threads.ensureThreadStructure(thread);

  logger.info("Thread created", { slug });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
