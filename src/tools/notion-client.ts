import { Client } from "@notionhq/client";

export class NotionClient {
  private readonly client: Client;

  constructor(token: string) {
    this.client = new Client({ auth: token });
  }

  async searchRecentPages(sinceIso: string): Promise<unknown[]> {
    const response = await this.client.search({
      filter: { property: "object", value: "page" },
      sort: { direction: "descending", timestamp: "last_edited_time" }
    });
    return response.results.filter((page) => {
      const lastEdited = (page as { last_edited_time?: string }).last_edited_time;
      return lastEdited ? new Date(lastEdited).toISOString() >= sinceIso : false;
    });
  }
}
