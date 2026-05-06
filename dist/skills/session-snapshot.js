import path from "path";
import { replaceSection } from "../utils/markdown-utils.js";
import { formatHourStamp, toIsoTimestamp } from "../utils/time.js";
import { formatSessionSnapshot } from "../utils/markdown-utils.js";
import { matchBestThread } from "../utils/keyword-matcher.js";
import { atomicWriteFile } from "../utils/fs-utils.js";
export function createSessionSnapshotBehavior(services) {
    return {
        name: "session_snapshot",
        handler: async () => {
            const { tools, memory, logger, heartbeatState, config } = services;
            if (!tools.browser || !tools.fileWatcher || !tools.clipboard) {
                logger.warn("Session snapshot skipped: tools not configured");
                return;
            }
            const state = await heartbeatState.load();
            const since = state.lastTickAt;
            const tabs = await tools.browser.fetchTabs();
            const fileEvents = tools.fileWatcher.drainEvents(since);
            const clipboardEntries = tools.clipboard.drainEntries(since);
            const threads = await memory.index.listThreads();
            const candidates = threads.map((thread) => ({
                slug: thread.slug,
                keywords: thread.topic_keywords
            }));
            const tabMatch = matchBestThread(candidates, tabs.map((tab) => `${tab.title} ${tab.url}`).join(" "));
            const fileMatch = matchBestThread(candidates, fileEvents.map((event) => event.path).join(" "));
            const activeMatch = [tabMatch, fileMatch].filter(Boolean).sort((a, b) => b.score - a.score)[0];
            const activeThread = activeMatch ? await memory.index.findBySlug(activeMatch.slug) : undefined;
            const timestamp = formatHourStamp();
            const snapshot = formatSessionSnapshot({
                timestamp: timestamp.replace(/-/g, "-").replace(/-(\d\d)$/, " $1:00"),
                duration: undefined,
                activeThread: activeThread?.slug,
                openTabs: tabs.map((tab) => ({
                    title: tab.title,
                    url: tab.url,
                    progress: tab.readingProgress
                })),
                clipboardEntries: clipboardEntries.map((entry) => entry.content),
                modifiedFiles: fileEvents.map((event) => event.path),
                observations: [],
                nextSessionHint: undefined
            });
            if (!activeThread) {
                const unclassifiedPath = path.join(config.memoryPath, "unclassified", `${timestamp}.md`);
                await atomicWriteFile(unclassifiedPath, snapshot);
                logger.info("Snapshot stored in unclassified", { path: unclassifiedPath });
                return;
            }
            await memory.threads.writeSessionSnapshot(activeThread.slug, `${timestamp}.md`, snapshot);
            const existingThread = (await memory.threads.readThreadMarkdown(activeThread.slug)) ?? "";
            if (tools.llm) {
                const summary = await tools.llm.generate({
                    promptName: "thread-summary",
                    variables: {
                        threadTitle: activeThread.title
                    },
                    contextChunks: [existingThread, snapshot]
                });
                const updated = replaceSection(replaceSection(existingThread || `# Thread: ${activeThread.title}\n`, "Summary", summary.trim()), "Current Focus", summary.trim());
                await memory.threads.writeThreadMarkdown(activeThread.slug, updated);
            }
            const updatedThread = {
                ...activeThread,
                last_touched: toIsoTimestamp(),
                last_snapshot: toIsoTimestamp()
            };
            await memory.index.updateThread(updatedThread);
            logger.info("Session snapshot saved", { thread: activeThread.slug, timestamp });
        }
    };
}
