import { Client } from "@notionhq/client";
export class NotionClient {
    client;
    constructor(token) {
        this.client = new Client({ auth: token });
    }
    async searchRecentPages(sinceIso) {
        const response = await this.client.search({
            filter: { property: "object", value: "page" },
            sort: { direction: "descending", timestamp: "last_edited_time" }
        });
        return response.results.filter((page) => {
            const lastEdited = page.last_edited_time;
            return lastEdited ? new Date(lastEdited).toISOString() >= sinceIso : false;
        });
    }
}
