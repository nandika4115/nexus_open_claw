import path from "path";
import { randomUUID } from "crypto";

import express from "express";
import type { Request, Response } from "express";
import type { Logger } from "winston";

import type { AppConfig } from "../config/index.js";
import type { MemoryStores } from "../memory/index.js";
import type { Source, Thread } from "../memory/schema.js";
import type { OpenClawCli } from "../tools/openclaw-cli.js";
import { toIsoTimestamp } from "../utils/time.js";

export interface DashboardServices {
  config: AppConfig;
  memory: MemoryStores;
  logger: Logger;
  openclaw: OpenClawCli;
  runLitWatch: () => Promise<void>;
}

function normalizeSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readBrowserTabs(port: number): Promise<unknown[]> {
  try {
    const response = await fetch(`http://localhost:${port}/tabs`);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as unknown;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function registerDashboard(app: express.Express, services: DashboardServices): void {
  const { config, memory, logger, openclaw } = services;
  const publicPath = path.join(process.cwd(), "public");

  app.use(express.static(publicPath));

  app.get("/api/status", async (_req: Request, res: Response) => {
    const [threads, openclawVersion, openclawHealth, tabs] = await Promise.all([
      memory.index.listThreads(),
      openclaw.version(),
      openclaw.health(),
      readBrowserTabs(config.browserExtPort)
    ]);
    const sourceCounts = await Promise.all(
      threads.map(async (thread) => {
        try {
          return (await memory.threads.readSources(thread.slug)).sources.length;
        } catch {
          return thread.source_count;
        }
      })
    );

    res.json({
      ok: true,
      memoryPath: config.memoryPath,
      browserExtPort: config.browserExtPort,
      threadCount: threads.length,
      sourceCount: sourceCounts.reduce((total, count) => total + count, 0),
      openclaw: {
        cli: openclawVersion.ok,
        version: openclawVersion.stdout,
        gateway: openclawHealth.ok
      },
      browser: {
        connected: tabs.length > 0,
        tabCount: tabs.length
      }
    });
  });

  app.get("/api/browser/tabs", async (_req: Request, res: Response) => {
    res.json(await readBrowserTabs(config.browserExtPort));
  });

  app.get("/api/threads", async (_req: Request, res: Response) => {
    const threads = await memory.index.listThreads();
    const enriched = await Promise.all(
      threads.map(async (thread) => {
        try {
          const sources = await memory.threads.readSources(thread.slug);
          return { ...thread, source_count: sources.sources.length };
        } catch {
          return thread;
        }
      })
    );
    res.json(enriched);
  });

  app.post("/api/threads", async (req: Request, res: Response) => {
    const title = String(req.body?.title ?? "").trim();
    const topicKeywords = parseKeywords(req.body?.topic_keywords);
    const priority = req.body?.priority === "high" || req.body?.priority === "low" ? req.body.priority : "medium";
    const watchSources = Array.isArray(req.body?.watch_sources)
      ? req.body.watch_sources.filter((source: unknown) =>
          ["arxiv", "core", "semantic_scholar"].includes(String(source))
        )
      : ["core"];

    if (!title || topicKeywords.length === 0) {
      res.status(400).json({ ok: false, error: "Title and at least one keyword are required." });
      return;
    }

    const now = toIsoTimestamp();
    const slug = normalizeSlug(title) || randomUUID();
    const thread: Thread = {
      id: slug,
      slug,
      title,
      status: "active",
      priority,
      created_at: now,
      last_touched: now,
      last_snapshot: now,
      topic_keywords: topicKeywords,
      source_count: 0,
      insight_count: 0,
      connection_count: 0,
      dormancy_threshold_hours: 72,
      watch_sources: watchSources as Thread["watch_sources"]
    };

    await memory.index.updateThread(thread);
    await memory.threads.ensureThreadStructure(thread);
    await memory.threads.writeThreadMarkdown(
      thread.slug,
      `# ${thread.title}\n\n## Focus\n${topicKeywords.join(", ")}\n`
    );

    logger.info("Dashboard thread created", { slug: thread.slug });
    res.status(201).json({ ok: true, thread });
  });

  app.get("/api/threads/:slug", async (req: Request, res: Response) => {
    const slug = req.params.slug;
    if (!slug) {
      res.status(400).json({ ok: false, error: "Thread slug is required" });
      return;
    }

    const thread = await memory.index.findBySlug(slug);
    if (!thread) {
      res.status(404).json({ ok: false, error: "Thread not found" });
      return;
    }

    const [threadMarkdown, insights, questions, sources] = await Promise.all([
      memory.threads.readThreadMarkdown(thread.slug),
      memory.threads.readInsights(thread.slug),
      memory.threads.readQuestions(thread.slug),
      memory.threads.readSources(thread.slug)
    ]);

    res.json({
      thread,
      markdown: threadMarkdown ?? "",
      insights: insights ?? "",
      questions: questions ?? "",
      sources: sources.sources
    });
  });

  app.post("/api/threads/:slug/import-tabs", async (req: Request, res: Response) => {
    const slug = req.params.slug;
    if (!slug) {
      res.status(400).json({ ok: false, error: "Thread slug is required" });
      return;
    }

    const thread = await memory.index.findBySlug(slug);
    if (!thread) {
      res.status(404).json({ ok: false, error: "Thread not found" });
      return;
    }

    const tabs = await readBrowserTabs(config.browserExtPort);
    const sources = await memory.threads.readSources(thread.slug);
    const knownUrls = new Set(sources.sources.map((source) => source.url));
    const now = toIsoTimestamp();
    const imported: Source[] = [];

    for (const item of tabs) {
      const tab = item as { title?: unknown; url?: unknown; readingProgress?: unknown };
      const url = String(tab.url ?? "");
      const title = String(tab.title ?? url);
      if (!url.startsWith("http") || knownUrls.has(url)) {
        continue;
      }

      knownUrls.add(url);
      imported.push({
        id: randomUUID(),
        url,
        title,
        authors: [],
        added_at: now,
        reading_progress: Math.max(0, Math.min(1, Number(tab.readingProgress ?? 0))),
        tags: ["browser"],
        citation_overlap: [],
        status: "seen_in_browser"
      });
    }

    if (imported.length > 0) {
      sources.sources.push(...imported);
      await memory.threads.writeSources(thread.slug, sources);
      await memory.index.updateThread({
        ...thread,
        source_count: sources.sources.length,
        last_touched: now
      });
    }

    res.json({ ok: true, imported: imported.length });
  });

  app.post("/api/lit-watch", async (_req: Request, res: Response) => {
    await services.runLitWatch();
    res.json({ ok: true });
  });

  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}
