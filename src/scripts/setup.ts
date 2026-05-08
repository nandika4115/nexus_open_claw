import fs from "fs/promises";
import path from "path";

import { loadConfig } from "../config/index.js";
import { createLogger } from "../utils/logger.js";
import { writeYamlFile } from "../utils/yaml-utils.js";
import { toIsoTimestamp } from "../utils/time.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const logger = createLogger({ level: config.logLevel, logPath: config.logPath });

  const base = config.memoryPath;
  const dirs = [
    base,
    path.join(base, "threads"),
    path.join(base, "digests", "daily"),
    path.join(base, "digests", "weekly"),
    path.join(base, "briefings")
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  await writeYamlFile(path.join(base, "_index.yaml"), {
    schema_version: "1.0",
    last_updated: toIsoTimestamp(),
    threads: []
  });

  await writeYamlFile(path.join(base, "_connections.yaml"), {
    connections: []
  });

  await writeYamlFile(path.join(base, "_config.yaml"), {
    user: {
      name: "Researcher",
      timezone: "UTC",
      morning_channel: "slack"
    },
    file_watcher: {
      enabled: true,
      watch_paths: ["~/Documents", "~/research", "~/Desktop"],
      extensions: [".md", ".txt", ".docx", ".pdf"],
      debounce_ms: 2000
    },
    channels: {
      desktop_notify: true,
      slack: true,
      imessage: false,
      whatsapp: false,
      email: false
    },
    behaviors: {
      session_snapshot: { enabled: true, interval_min: 30 },
      thread_resurrection: { enabled: true, dormancy_threshold_hours: 72 },
      connection_engine: { enabled: true, schedule: "23:00", similarity_threshold: 0.75 },
      morning_briefing: { enabled: true, schedule: "08:30", max_threads_in_brief: 5 },
      lit_watch: { enabled: true, schedule: "06:00", relevance_threshold: 0.6, max_papers_per_thread: 10 }
    },
    llm: {
      primary: "claude-sonnet-4-20250514",
      fallback: "gpt-4o",
      max_context_tokens: 8000,
      max_output_tokens: 1000,
      temperature: 0.3
    }
  });

  await fs.writeFile(
    path.join(base, "SOUL.md"),
    "# mnemochron SOUL\n\nAgent: mnemochron\nPurpose: Research continuity companion\nTone: Helpful, non-intrusive, research-aware\nPrivacy: Local-first, no data exfiltration\n",
    "utf8"
  );

  await fs.writeFile(
    path.join(base, "HEARTBEAT.md"),
    "# mnemochron HEARTBEAT Configuration\n\n## Tick Interval\nevery: 30 minutes\n\n## Behaviors\n\n### snapshot\ntrigger: tick\naction: run_session_snapshot\n\n### thread_resurrection\ntrigger: tick\ncondition: dormant_thread_activity_detected\naction: resurface_thread_context\n\n### connection_engine\ntrigger: daily at 23:00\naction: run_semantic_similarity_pass\n\n### morning_briefing\ntrigger: daily at configured_briefing_time (default 08:30)\naction: generate_morning_briefing\n\n### lit_watch\ntrigger: daily at 06:00\naction: scan_publication_feeds\n",
    "utf8"
  );

  logger.info("Memory initialized", { path: base });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
