import { requestWithRetry } from "../utils/http-client.js";
export class ObsidianClient {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async readNote(path) {
        return requestWithRetry({
            url: `${this.baseUrl}/vault/${encodeURIComponent(path)}`,
            method: "GET",
            headers: { Authorization: `Bearer ${this.apiKey}` }
        });
    }
    async writeNote(path, content) {
        await requestWithRetry({
            url: `${this.baseUrl}/vault/${encodeURIComponent(path)}`,
            method: "PUT",
            headers: { Authorization: `Bearer ${this.apiKey}` },
            data: content
        });
    }
    async search(query) {
        return requestWithRetry({
            url: `${this.baseUrl}/search/simple`,
            method: "GET",
            headers: { Authorization: `Bearer ${this.apiKey}` },
            params: { q: query }
        });
    }
}
