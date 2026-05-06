import type { Logger } from "winston";

import type { AppConfig } from "../config/index.js";
import type { MemoryStores } from "../memory/index.js";
import type { BrowserExtensionClient } from "../tools/browser-extension.js";
import type { ClipboardMonitor } from "../tools/clipboard-monitor.js";
import type { FileWatcher } from "../tools/file-watcher.js";
import type { ArxivClient } from "../tools/arxiv-client.js";
import type { SemanticScholarClient } from "../tools/semantic-scholar.js";
import type { LlmClient } from "../tools/llm-client.js";
import type { NotionClient } from "../tools/notion-client.js";
import type { ObsidianClient } from "../tools/obsidian-client.js";
import type { DesktopNotifier } from "../channels/desktop-notify.js";
import type { SlackChannel } from "../channels/slack.js";
import type { IMessageChannel } from "../channels/imessage.js";
import type { WhatsAppChannel } from "../channels/whatsapp.js";
import type { EmailChannel } from "../channels/email.js";
import type { HeartbeatStateStore } from "../engine/heartbeat-state.js";

export interface SkillTools {
  browser?: BrowserExtensionClient;
  fileWatcher?: FileWatcher;
  clipboard?: ClipboardMonitor;
  arxiv?: ArxivClient;
  semanticScholar?: SemanticScholarClient;
  llm?: LlmClient;
  notion?: NotionClient;
  obsidian?: ObsidianClient;
}

export interface SkillChannels {
  desktop?: DesktopNotifier;
  slack?: SlackChannel;
  imessage?: IMessageChannel;
  whatsapp?: WhatsAppChannel;
  email?: EmailChannel;
}

export interface SkillServices {
  config: AppConfig;
  memory: MemoryStores;
  tools: SkillTools;
  channels: SkillChannels;
  heartbeatState: HeartbeatStateStore;
  logger: Logger;
}
