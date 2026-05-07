import { z } from "zod";

import { requestWithRetry } from "../utils/http-client.js";
import { RateLimiter } from "../utils/rate-limiter.js";

const CoreAuthorSchema = z.object({
  name: z.string()
});

const CoreLinkSchema = z.object({
  type: z.string().optional(),
  url: z.string().optional()
});

const CoreWorkSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  abstract: z.string().nullable().optional(),
  authors: z.array(CoreAuthorSchema).optional(),
  yearPublished: z.number().nullable().optional(),
  citationCount: z.number().nullable().optional(),
  doi: z.string().nullable().optional(),
  downloadUrl: z.string().nullable().optional(),
  links: z.array(CoreLinkSchema).optional()
});

const SearchResponseSchema = z.object({
  results: z.array(CoreWorkSchema)
});

export interface CorePaper {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  year?: number;
  citationCount?: number;
  doi?: string;
  url: string;
}

export class CoreClient {
  private readonly baseUrl = "https://api.core.ac.uk/v3";
  private readonly limiter = new RateLimiter(3000);
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, limit = 10): Promise<CorePaper[]> {
    await this.limiter.schedule();
    const data = await requestWithRetry<unknown>({
      url: `${this.baseUrl}/search/works/`,
      method: "GET",
      params: {
        q: query,
        limit
      },
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
    });

    const parsed = SearchResponseSchema.parse(data);
    return parsed.results.map((paper) => {
      const displayUrl =
        paper.links?.find((link) => link.type === "display")?.url ??
        paper.downloadUrl ??
        `https://core.ac.uk/works/${paper.id}`;

      return {
        id: String(paper.id),
        title: paper.title,
        abstract: paper.abstract ?? undefined,
        authors: paper.authors ? paper.authors.map((author) => author.name) : [],
        year: paper.yearPublished ?? undefined,
        citationCount: paper.citationCount ?? undefined,
        doi: paper.doi ?? undefined,
        url: displayUrl
      };
    });
  }
}
