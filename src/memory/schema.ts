import { z } from "zod";

export const ThreadStatusSchema = z.enum(["active", "dormant", "archived"]);
export const ThreadPrioritySchema = z.enum(["high", "medium", "low"]);
export const WatchSourceSchema = z.enum(["arxiv", "core", "semantic_scholar"]);

export const ThreadSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  status: ThreadStatusSchema,
  priority: ThreadPrioritySchema,
  created_at: z.string(),
  last_touched: z.string(),
  last_snapshot: z.string().optional(),
  topic_keywords: z.array(z.string()),
  source_count: z.number().int().nonnegative(),
  insight_count: z.number().int().nonnegative(),
  connection_count: z.number().int().nonnegative(),
  dormancy_threshold_hours: z.number().int().positive(),
  watch_sources: z.array(WatchSourceSchema).optional().default([])
});

export const IndexSchema = z.object({
  schema_version: z.string(),
  last_updated: z.string(),
  threads: z.array(ThreadSchema)
});

export const ConnectionSchema = z.object({
  id: z.string(),
  from_thread: z.string(),
  to_thread: z.string(),
  strength: z.number().min(0).max(1),
  basis: z.enum(["citation_overlap", "keyword_match", "manual"]),
  shared_concepts: z.array(z.string()),
  discovered_at: z.string(),
  surfaced_to_user: z.boolean()
});

export const ConnectionsSchema = z.object({
  connections: z.array(ConnectionSchema)
});

export const SourceSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  authors: z.array(z.string()).optional().default([]),
  published: z.string().optional(),
  added_at: z.string(),
  last_read: z.string().optional(),
  reading_progress: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional().default([]),
  key_excerpt: z.string().optional(),
  citation_overlap: z.array(z.string()).optional().default([]),
  status: z.string().optional()
});

export const SourcesFileSchema = z.object({
  sources: z.array(SourceSchema)
});

export const RuntimeConfigSchema = z.object({
  user: z.object({
    name: z.string(),
    timezone: z.string(),
    morning_channel: z.enum(["imessage", "slack", "whatsapp", "email"]) 
  }),
  file_watcher: z.object({
    enabled: z.boolean(),
    watch_paths: z.array(z.string()),
    extensions: z.array(z.string()),
    debounce_ms: z.number()
  }),
  channels: z.object({
    desktop_notify: z.boolean(),
    slack: z.boolean(),
    imessage: z.boolean(),
    whatsapp: z.boolean(),
    email: z.boolean()
  }),
  behaviors: z.object({
    session_snapshot: z.object({
      enabled: z.boolean(),
      interval_min: z.number()
    }),
    thread_resurrection: z.object({
      enabled: z.boolean(),
      dormancy_threshold_hours: z.number()
    }),
    connection_engine: z.object({
      enabled: z.boolean(),
      schedule: z.string(),
      similarity_threshold: z.number()
    }),
    morning_briefing: z.object({
      enabled: z.boolean(),
      schedule: z.string(),
      max_threads_in_brief: z.number()
    }),
    lit_watch: z.object({
      enabled: z.boolean(),
      schedule: z.string(),
      relevance_threshold: z.number(),
      max_papers_per_thread: z.number()
    })
  }),
  llm: z.object({
    primary: z.string(),
    fallback: z.string(),
    max_context_tokens: z.number(),
    max_output_tokens: z.number(),
    temperature: z.number()
  })
});

export type Thread = z.infer<typeof ThreadSchema>;
export type IndexFile = z.infer<typeof IndexSchema>;
export type Connection = z.infer<typeof ConnectionSchema>;
export type ConnectionsFile = z.infer<typeof ConnectionsSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type SourcesFile = z.infer<typeof SourcesFileSchema>;
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;
