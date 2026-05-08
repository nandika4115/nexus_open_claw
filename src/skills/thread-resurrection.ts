import type { PlannedBehavior } from "../engine/types.js";
import type { Thread } from "../memory/schema.js";
import { matchBestThread } from "../utils/keyword-matcher.js";
import { toIsoTimestamp } from "../utils/time.js";
import type { SkillServices } from "./context.js";

export function createThreadResurrectionBehavior(services: SkillServices): PlannedBehavior {
  return {
    name: "thread_resurrection",
    handler: async () => {
      const { tools, memory, logger, channels, config, heartbeatState } = services;
      if (!tools.browser || !tools.fileWatcher) {
        logger.warn("Thread resurrection skipped: tools not configured");
        return;
      }

      if (!config.runtimeConfig?.behaviors.thread_resurrection.enabled) {
        return;
      }

      const state = await heartbeatState.load();
      const since = state.lastTickAt;
      const tabs = await tools.browser.fetchTabs();
      const fileEvents = tools.fileWatcher.drainEvents(since);
      const threads = await memory.index.listThreads();

      const candidates = threads.map((thread) => ({
        slug: thread.slug,
        keywords: thread.topic_keywords
      }));

      const match = matchBestThread(
        candidates,
        `${tabs.map((tab) => `${tab.title} ${tab.url}`).join(" ")} ${fileEvents
          .map((event) => event.path)
          .join(" ")}`
      );

      if (!match) {
        return;
      }

      const thread = await memory.index.findBySlug(match.slug);
      if (!thread) {
        return;
      }

      const dormancyHours = thread.dormancy_threshold_hours ?? config.dormancyThresholdHours;
      const lastTouched = new Date(thread.last_touched).getTime();
      const dormant = Date.now() - lastTouched > dormancyHours * 60 * 60 * 1000;

      if (!dormant) {
        return;
      }

      const threadMarkdown = (await memory.threads.readThreadMarkdown(thread.slug)) ?? "";
      const insights = (await memory.threads.readInsights(thread.slug)) ?? "";
      const questions = (await memory.threads.readQuestions(thread.slug)) ?? "";
      const topInsights = insights
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 3)
        .join("\n");

      const message = [
        `You're back on: "${thread.title}"`,
        "",
        "Where you left off:",
        threadMarkdown,
        "",
        "Top insights:",
        topInsights || "No insights captured yet.",
        "",
        "Open questions:",
        questions || "No open questions captured yet."
      ].join("\n");

      if (channels.desktop && config.runtimeConfig?.channels.desktop_notify) {
        await channels.desktop.notify({
          title: "mnemochron: Thread Resurface Alert",
          message
        });
      }

      const updated: Thread = { ...thread, status: "active", last_touched: toIsoTimestamp() };
      await memory.index.updateThread(updated);

      logger.info("Thread resurrected", { thread: thread.slug });
    }
  };
}
