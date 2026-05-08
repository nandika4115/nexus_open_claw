import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

const optionalLogLevel = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["debug", "info", "warn", "error"]).optional()
);

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: optionalString,
  GEMINI_API_KEY: optionalString,
  LLM_PRIMARY: z.enum(["claude", "gemini", "local"]).default("claude"),
  LLM_FALLBACK: z.enum(["claude", "gemini", "local"]).default("gemini"),
  NOTION_INTEGRATION_TOKEN: optionalString,
  NOTION_WORKSPACE_ID: optionalString,
  SLACK_BOT_TOKEN: optionalString,
  SLACK_USER_ID: optionalString,
  IMESSAGE_RECIPIENT: optionalString,
  OPENCLAW_CLI_PATH: optionalString,
  OPENCLAW_GATEWAY_PORT: z.string().optional(),
  WHATSAPP_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  WHATSAPP_RECIPIENT: optionalString,
  WHATSAPP_DEFAULT_COUNTRY_CODE: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalString,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  EMAIL_RECIPIENTS: optionalString,
  CORE_API_KEY: optionalString,
  SEMANTIC_SCHOLAR_API_KEY: optionalString,
  BROWSER_EXT_PORT: z.string().optional(),
  MNEMOCHRON_MEMORY_PATH: optionalString,
  MNEMOCHRON_HEARTBEAT_INTERVAL_MIN: z.string().optional(),
  MNEMOCHRON_MORNING_BRIEFING_TIME: z.string().optional(),
  MNEMOCHRON_LIT_WATCH_TIME: z.string().optional(),
  MNEMOCHRON_CONNECTION_ENGINE_TIME: z.string().optional(),
  MNEMOCHRON_DORMANCY_THRESHOLD_HOURS: z.string().optional(),
  MNEMOCHRON_LOG_LEVEL: optionalLogLevel,
  MNEMOCHRON_LOG_PATH: optionalString
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function loadEnvConfig(rawEnv: NodeJS.ProcessEnv): EnvConfig {
  return EnvSchema.parse(rawEnv);
}
