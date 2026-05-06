import { requestWithRetry } from "../utils/http-client.js";

export class ObsidianClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async readNote(path: string): Promise<string> {
    return requestWithRetry<string>({
      url: `${this.baseUrl}/vault/${encodeURIComponent(path)}`,
      method: "GET",
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
  }

  async writeNote(path: string, content: string): Promise<void> {
    await requestWithRetry({
      url: `${this.baseUrl}/vault/${encodeURIComponent(path)}`,
      method: "PUT",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      data: content
    });
  }

  async search(query: string): Promise<unknown> {
    return requestWithRetry({
      url: `${this.baseUrl}/search/simple`,
      method: "GET",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      params: { q: query }
    });
  }
}
