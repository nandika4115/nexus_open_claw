import { z } from "zod";

import { requestWithRetry } from "../utils/http-client.js";

const TabSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  timeOnPage: z.number(),
  readingProgress: z.number().min(0).max(1),
  windowActive: z.boolean(),
  tabIndex: z.number()
});

const HistorySchema = z.object({
  url: z.string().url(),
  title: z.string(),
  visitedAt: z.string(),
  duration: z.number()
});

export type BrowserTab = z.infer<typeof TabSchema>;
export type BrowserHistoryEntry = z.infer<typeof HistorySchema>;

export class BrowserExtensionClient {
  private readonly baseUrl: string;

  constructor(port: number) {
    this.baseUrl = `http://localhost:${port}`;
  }

  async fetchTabs(): Promise<BrowserTab[]> {
    const data = await requestWithRetry<unknown>({
      url: `${this.baseUrl}/tabs`,
      method: "GET"
    });
    return z.array(TabSchema).parse(data);
  }

  async fetchHistory(sinceIso: string): Promise<BrowserHistoryEntry[]> {
    const data = await requestWithRetry<unknown>({
      url: `${this.baseUrl}/history`,
      method: "GET",
      params: { since: sinceIso }
    });
    return z.array(HistorySchema).parse(data);
  }
}
