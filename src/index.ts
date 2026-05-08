import "dotenv/config";

import { loadConfig } from "./config/index.js";
import { HeartbeatDaemon } from "./engine/heartbeat.js";
import { PiEngine } from "./engine/pi-engine.js";
import { Planner } from "./engine/planner.js";
import { GatewayRouter } from "./gateway/router.js";
import { GatewayServer } from "./gateway/server.js";
import { createMemoryStores } from "./memory/index.js";
import { HeartbeatStateStore } from "./engine/heartbeat-state.js";
import { createConnectionEngineBehavior } from "./skills/connection-engine.js";
import { createLitWatchBehavior } from "./skills/lit-watch.js";
import { createMorningBriefingBehavior } from "./skills/morning-briefing.js";
import { createSessionSnapshotBehavior } from "./skills/session-snapshot.js";
import { createThreadResurrectionBehavior } from "./skills/thread-resurrection.js";
import { registerDashboard } from "./ui/dashboard.js";
import { ArxivClient } from "./tools/arxiv-client.js";
import { BrowserExtensionClient } from "./tools/browser-extension.js";
import { ClipboardMonitor } from "./tools/clipboard-monitor.js";
import { CoreClient } from "./tools/core-client.js";
import { FileWatcher } from "./tools/file-watcher.js";
import { LlmClient } from "./tools/llm-client.js";
import { OpenClawCli } from "./tools/openclaw-cli.js";
import { SemanticScholarClient } from "./tools/semantic-scholar.js";
import { DesktopNotifier } from "./channels/desktop-notify.js";
import { SlackChannel } from "./channels/slack.js";
import { IMessageChannel } from "./channels/imessage.js";
import { WhatsAppChannel } from "./channels/whatsapp.js";
import { EmailChannel } from "./channels/email.js";
import { createLogger } from "./utils/logger.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const logger = createLogger({ level: config.logLevel, logPath: config.logPath });

  logger.info("mnemochron starting", {
    memoryPath: config.memoryPath,
    heartbeatIntervalMin: config.heartbeatIntervalMin
  });

  const memory = createMemoryStores(config.memoryPath, logger);
  await memory.index.load();
  await memory.connections.load();

  logger.info("Memory layer loaded");

  const fileWatcher = config.runtimeConfig?.file_watcher.enabled
    ? new FileWatcher({
        watchPaths: config.runtimeConfig.file_watcher.watch_paths,
        extensions: config.runtimeConfig.file_watcher.extensions,
        ignorePatterns: ["node_modules/**", ".git/**"],
        debounceMs: config.runtimeConfig.file_watcher.debounce_ms
      })
    : undefined;

  if (fileWatcher) {
    fileWatcher.start();
  }

  const clipboard = new ClipboardMonitor();
  clipboard.start();

  const tools = {
    openclaw: new OpenClawCli({ command: config.env.OPENCLAW_CLI_PATH }),
    browser: new BrowserExtensionClient(config.browserExtPort),
    fileWatcher,
    clipboard,
    arxiv: new ArxivClient(),
    core: new CoreClient(config.env.CORE_API_KEY),
    semanticScholar: new SemanticScholarClient(config.env.SEMANTIC_SCHOLAR_API_KEY),
    llm: config.runtimeConfig
      ? new LlmClient(
          {
            primary: config.env.LLM_PRIMARY,
            fallback: config.env.LLM_FALLBACK,
            anthropicApiKey: config.env.ANTHROPIC_API_KEY,
            geminiApiKey: config.env.GEMINI_API_KEY,
            maxContextTokens: config.runtimeConfig.llm.max_context_tokens,
            maxOutputTokens: config.runtimeConfig.llm.max_output_tokens,
            temperature: config.runtimeConfig.llm.temperature,
            promptsPath: `${process.cwd()}/prompts`
          },
          logger
        )
      : undefined
  } as const;

  const channels = {
    desktop: new DesktopNotifier(),
    slack:
      config.env.SLACK_BOT_TOKEN && config.env.SLACK_USER_ID
        ? new SlackChannel(config.env.SLACK_BOT_TOKEN, config.env.SLACK_USER_ID)
        : undefined,
    imessage: config.env.IMESSAGE_RECIPIENT
      ? new IMessageChannel(config.env.IMESSAGE_RECIPIENT)
      : undefined,
    whatsapp: config.env.WHATSAPP_ENABLED
      ? new WhatsAppChannel({
          openclaw: tools.openclaw,
          recipient: config.env.WHATSAPP_RECIPIENT
        })
      : undefined,
    email:
      config.env.SMTP_HOST && config.env.SMTP_USER && config.env.SMTP_PASS && config.env.EMAIL_RECIPIENTS
        ? new EmailChannel({
            host: config.env.SMTP_HOST,
            port: Number(config.env.SMTP_PORT ?? "587"),
            user: config.env.SMTP_USER,
            pass: config.env.SMTP_PASS,
            recipients: config.env.EMAIL_RECIPIENTS.split(",").map((item) => item.trim())
          })
        : undefined
  };

  const planner = new Planner(config.runtimeConfig);
  const engine = new PiEngine(logger, planner);

  const heartbeatState = new HeartbeatStateStore(config.memoryPath);
  const skillServices = {
    config,
    memory,
    tools,
    channels,
    heartbeatState,
    logger
  };

  engine.registerBehavior("session_snapshot", createSessionSnapshotBehavior(skillServices).handler);
  engine.registerBehavior(
    "thread_resurrection",
    createThreadResurrectionBehavior(skillServices).handler
  );
  engine.registerBehavior("connection_engine", createConnectionEngineBehavior(skillServices).handler);
  engine.registerBehavior("morning_briefing", createMorningBriefingBehavior(skillServices).handler);
  engine.registerBehavior("lit_watch", createLitWatchBehavior(skillServices).handler);
  const litWatchBehavior = createLitWatchBehavior(skillServices);

  const router = new GatewayRouter(logger, (signal) => engine.handleSignal(signal));
  const gateway = new GatewayServer(logger, router, {
    port: Number(process.env.PORT ?? "8080"),
    configureApp: (app) =>
      registerDashboard(app, {
        config,
        memory,
        logger,
        openclaw: tools.openclaw,
        runLitWatch: () =>
          litWatchBehavior.handler({
            signal: {
              type: "daily_schedule",
              timestamp: new Date().toISOString(),
              payload: { schedule: "lit_watch" }
            }
          })
      })
  });

  gateway.start();

  const heartbeat = new HeartbeatDaemon(
    logger,
    config.memoryPath,
    {
      intervalMin: config.heartbeatIntervalMin,
      dailySchedules: [
        { name: "lit_watch", time: config.litWatchTime },
        { name: "morning_briefing", time: config.morningBriefingTime },
        { name: "connection_engine", time: config.connectionEngineTime }
      ]
    },
    (signal) => engine.handleSignal(signal)
  );

  await heartbeat.start();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
