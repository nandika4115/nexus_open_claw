import { z } from "zod";

import { requestWithRetry } from "../utils/http-client.js";
import { RateLimiter } from "../utils/rate-limiter.js";

const PaperSchema = z.object({
  paperId: z.string(),
  title: z.string(),
  abstract: z.string().optional(),
  authors: z.array(z.object({ name: z.string() })).optional(),
  year: z.number().optional(),
  citationCount: z.number().optional()
});

const SearchResponseSchema = z.object({
  data: z.array(PaperSchema)
});

export interface SemanticScholarPaper {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  year?: number;
  citationCount?: number;
}

export class SemanticScholarClient {
  private readonly baseUrl = "https://api.semanticscholar.org/graph/v1";
  private readonly limiter = new RateLimiter(3000);
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, limit = 10): Promise<SemanticScholarPaper[]> {
    await this.limiter.schedule();
    const data = await requestWithRetry<unknown>({
      url: `${this.baseUrl}/paper/search`,
      method: "GET",
      params: {
        query,
        limit,
        fields: "title,authors,year,citationCount,abstract"
      },
      headers: this.apiKey ? { "x-api-key": this.apiKey } : undefined
    });

    const parsed = SearchResponseSchema.parse(data);
    return parsed.data.map((paper) => ({
      id: paper.paperId,
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.authors ? paper.authors.map((author) => author.name) : [],
      year: paper.year,
      citationCount: paper.citationCount
    }));
  }
}
