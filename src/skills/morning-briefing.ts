import fs from "fs/promises";
import path from "path";

import type { PlannedBehavior } from "../engine/types.js";
import type { Connection } from "../memory/schema.js";
import { formatDateStamp } from "../utils/time.js";
import type { SkillServices } from "./context.js";

function priorityWeight(priority: string): number {
  if (priority === "high") {
    return 3;
  }
  if (priority === "medium") {
    return 2;
  }
  return 1;
}

export function createMorningBriefingBehavior(services: SkillServices): PlannedBehavior {
  return {
    name: "morning_briefing",
    handler: async () => {
      const { memory, tools, channels, config, logger } = services;
      if (!config.runtimeConfig?.behaviors.morning_briefing.enabled) {
        return;
      }

      const threads = await memory.index.listThreads();
      const active = threads
        .filter((thread) => thread.status === "active")
        .sort((a, b) => {
          const priority = priorityWeight(b.priority) - priorityWeight(a.priority);
          if (priority !== 0) {
            return priority;
          }
          return new Date(b.last_touched).getTime() - new Date(a.last_touched).getTime();
        })
        .slice(0, config.runtimeConfig.behaviors.morning_briefing.max_threads_in_brief);

      const connections = await memory.connections.listUnsurfaced();

      const threadBlocks: string[] = [];
      for (const thread of active) {
        const sessionsPath = path.join(config.memoryPath, "threads", thread.slug, "sessions");
        let lastSnapshot = "";
        try {
          const files = await fs.readdir(sessionsPath);
          const latest = files.sort().pop();
          if (latest) {
            lastSnapshot = await fs.readFile(path.join(sessionsPath, latest), "utf8");
          }
        } catch (error) {
          lastSnapshot = "";
        }

        const sources = await memory.threads.readSources(thread.slug);
        const newSources = sources.sources.filter((source) => source.status === "new_unread");

        threadBlocks.push(
          `📌 ${thread.title} [${thread.priority.toUpperCase()}]\n   → Left off: ${
            lastSnapshot.split("\n").find((line) => line.startsWith("## Suggested")) ??
            "See last snapshot"
          }\n   → NEW: ${newSources.length} new sources`
        );
      }

      const connectionBlocks = connections.slice(0, 3).map((conn) => formatConnection(conn));
      const briefing = [
        `☀️ mnemochron Morning Briefing — ${formatDateStamp()}`,
        "",
        `ACTIVE THREADS (${active.length})`,
        "",
        ...threadBlocks,
        "",
        connectionBlocks.length > 0 ? "🔗 NEW CONNECTIONS" : "",
        ...connectionBlocks,
        ""
      ].join("\n");

      const finalBriefing = tools.llm
        ? await tools.llm.generate({
            promptName: "morning-briefing",
            variables: {},
            contextChunks: [briefing]
          })
        : briefing;

      await deliverBriefing(services, finalBriefing);

      const briefingsPath = path.join(config.memoryPath, "briefings");
      await fs.mkdir(briefingsPath, { recursive: true });
      await fs.writeFile(
        path.join(briefingsPath, `${formatDateStamp()}-morning.md`),
        finalBriefing,
        "utf8"
      );

      for (const connection of connections) {
        connection.surfaced_to_user = true;
      }
      await memory.connections.save({ connections });

      logger.info("Morning briefing delivered", { threadCount: active.length });
    }
  };
}

function formatConnection(connection: Connection): string {
  return `"${connection.from_thread}" ↔ "${connection.to_thread}"\n   Shared: ${connection.shared_concepts.join(", ")}`;
}

async function deliverBriefing(services: SkillServices, message: string): Promise<void> {
  const channel = services.config.runtimeConfig?.user.morning_channel;
  if (channel === "slack" && services.channels.slack) {
    await services.channels.slack.sendDirectMessage(message);
    return;
  }
  if (channel === "imessage" && services.channels.imessage) {
    await services.channels.imessage.send(message);
    return;
  }
  if (channel === "whatsapp" && services.channels.whatsapp) {
    await services.channels.whatsapp.send(message);
    return;
  }
  if (channel === "email" && services.channels.email) {
    await services.channels.email.send("mnemochron Morning Briefing", message);
  }
}
