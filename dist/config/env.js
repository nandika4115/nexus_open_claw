import { z } from "zod";
const EnvSchema = z.object({
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    LLM_PRIMARY: z.enum(["claude", "openai", "local"]).default("claude"),
    LLM_FALLBACK: z.enum(["claude", "openai", "local"]).default("openai"),
    NOTION_INTEGRATION_TOKEN: z.string().min(1).optional(),
    NOTION_WORKSPACE_ID: z.string().min(1).optional(),
    SLACK_BOT_TOKEN: z.string().min(1).optional(),
    SLACK_USER_ID: z.string().min(1).optional(),
    IMESSAGE_RECIPIENT: z.string().min(1).optional(),
    WHATSAPP_ENABLED: z
        .string()
        .optional()
        .transform((value) => value === "true"),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.string().min(1).optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    EMAIL_RECIPIENTS: z.string().min(1).optional(),
    SEMANTIC_SCHOLAR_API_KEY: z.string().min(1).optional(),
    BROWSER_EXT_PORT: z.string().optional(),
    NEXUS_MEMORY_PATH: z.string().min(1).optional(),
    NEXUS_HEARTBEAT_INTERVAL_MIN: z.string().optional(),
    NEXUS_MORNING_BRIEFING_TIME: z.string().optional(),
    NEXUS_LIT_WATCH_TIME: z.string().optional(),
    NEXUS_CONNECTION_ENGINE_TIME: z.string().optional(),
    NEXUS_DORMANCY_THRESHOLD_HOURS: z.string().optional(),
    NEXUS_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
    NEXUS_LOG_PATH: z.string().optional()
});
export function loadEnvConfig(rawEnv) {
    return EnvSchema.parse(rawEnv);
}
