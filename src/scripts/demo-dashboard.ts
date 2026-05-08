import { randomUUID } from "crypto";

import { loadConfig } from "../config/index.js";
import { createMemoryStores } from "../memory/index.js";
import type { Source, Thread } from "../memory/schema.js";
import { createLogger } from "../utils/logger.js";
import { toIsoTimestamp } from "../utils/time.js";

const demoSlug = "rag-evaluation-dashboard-demo";

const demoSources: Array<Pick<Source, "url" | "title" | "authors" | "status" | "tags">> = [
  {
    url: "https://core.ac.uk/works/157283975",
    title: "A Comprehensive Survey of Hallucination Mitigation Techniques in Large Language Models",
    authors: ["Aman Chadha", "Amitava Das", "Vinija Jain"],
    status: "new_unread",
    tags: ["hallucination", "survey", "rag"]
  },
  {
    url: "https://core.ac.uk/works/162766677",
    title: "Mitigating Hallucinations in Large Language Models via Self-Refinement-Enhanced Knowledge Retrieval",
    authors: ["Hamed Haddadi", "Hao Li", "Fan Mo"],
    status: "new_unread",
    tags: ["knowledge retrieval", "factuality"]
  },
  {
    url: "https://core.ac.uk/works/300214089",
    title: "GraphRAG for the Portuguese Legal Domain",
    authors: ["Patricia Nunes Domingos Esteves"],
    status: "new_unread",
    tags: ["graphrag", "legal", "evaluation"]
  }
];

const demoTabs = [
  {
    tabId: 101,
    title: "Retrieval-augmented generation - Wikipedia",
    url: "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
    timeOnPage: 420,
    readingProgress: 0.68,
    windowActive: true,
    tabIndex: 0
  },
  {
    tabId: 102,
    title: "CORE: A Comprehensive Survey of Hallucination Mitigation Techniques",
    url: "https://core.ac.uk/works/157283975",
    timeOnPage: 260,
    readingProgress: 0.34,
    windowActive: false,
    tabIndex: 1
  },
  {
    tabId: 103,
    title: "arXiv search: retrieval augmented generation evaluation",
    url: "https://arxiv.org/search/?query=retrieval+augmented+generation+evaluation&searchtype=all",
    timeOnPage: 180,
    readingProgress: 0.18,
    windowActive: false,
    tabIndex: 2
  }
];

async function seedBrowserBridge(browserExtPort: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${browserExtPort}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tabs: demoTabs,
        history: [],
        timestamp: toIsoTimestamp()
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const config = await loadConfig();
  const logger = createLogger({ level: config.logLevel, logPath: config.logPath });
  const memory = createMemoryStores(config.memoryPath, logger);
  const now = toIsoTimestamp();

  const thread: Thread = {
    id: demoSlug,
    slug: demoSlug,
    title: "RAG Evaluation Dashboard Demo",
    status: "active",
    priority: "high",
    created_at: now,
    last_touched: now,
    last_snapshot: now,
    topic_keywords: [
      "retrieval augmented generation",
      "rag evaluation",
      "hallucination reduction",
      "knowledge retrieval"
    ],
    source_count: demoSources.length,
    insight_count: 0,
    connection_count: 0,
    dormancy_threshold_hours: 72,
    watch_sources: ["core"]
  };

  await memory.index.updateThread(thread);
  await memory.threads.ensureThreadStructure(thread);
  await memory.threads.writeThreadMarkdown(
    thread.slug,
    `# ${thread.title}

## Summary
Demo thread for testing the mnemochron dashboard, CORE-backed sources, and browser context display.

## Current Focus
Compare how RAG evaluation papers measure factuality, hallucination reduction, retrieval quality, and domain-specific grounding.
`
  );
  await memory.threads.writeSources(thread.slug, {
    sources: demoSources.map((source) => ({
      id: randomUUID(),
      url: source.url,
      title: source.title,
      authors: source.authors,
      added_at: now,
      reading_progress: 0,
      tags: source.tags,
      citation_overlap: [],
      status: source.status
    }))
  });

  const bridgeSeeded = await seedBrowserBridge(config.browserExtPort);

  // eslint-disable-next-line no-console
  console.log("Demo dashboard data seeded.");
  // eslint-disable-next-line no-console
  console.log(`Thread: ${thread.title}`);
  // eslint-disable-next-line no-console
  console.log(`Sources: ${demoSources.length}`);
  // eslint-disable-next-line no-console
  console.log(`Browser bridge seeded: ${bridgeSeeded ? "yes" : "no - start npm run browser:bridge and rerun"}`);
  // eslint-disable-next-line no-console
  console.log("Dashboard: http://localhost:8080");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
