import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { requestWithRetry } from "../utils/http-client.js";
import { RateLimiter } from "../utils/rate-limiter.js";
const ArxivEntrySchema = z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    published: z.string(),
    author: z.union([z.array(z.object({ name: z.string() })), z.object({ name: z.string() })]).optional()
});
export class ArxivClient {
    baseUrl = "http://export.arxiv.org/api/query";
    limiter = new RateLimiter(3000);
    async searchByKeywords(keywords, maxResults = 10) {
        await this.limiter.schedule();
        const query = keywords.map((keyword) => `ti:${keyword} OR abs:${keyword}`).join(" OR ");
        const data = await requestWithRetry({
            url: this.baseUrl,
            method: "GET",
            params: {
                search_query: query,
                sortBy: "submittedDate",
                sortOrder: "descending",
                start: 0,
                max_results: maxResults
            }
        });
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsed = parser.parse(data);
        const entries = parsed.feed?.entry
            ? Array.isArray(parsed.feed.entry)
                ? parsed.feed.entry
                : [parsed.feed.entry]
            : [];
        return entries.map((entry) => {
            const parsedEntry = ArxivEntrySchema.parse(entry);
            const authors = Array.isArray(parsedEntry.author)
                ? parsedEntry.author.map((author) => author.name)
                : parsedEntry.author
                    ? [parsedEntry.author.name]
                    : [];
            return {
                id: parsedEntry.id,
                title: parsedEntry.title.trim(),
                summary: parsedEntry.summary.trim(),
                published: parsedEntry.published,
                authors
            };
        });
    }
}
