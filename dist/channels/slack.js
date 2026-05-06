import { WebClient } from "@slack/web-api";
export class SlackChannel {
    client;
    userId;
    constructor(token, userId) {
        this.client = new WebClient(token);
        this.userId = userId;
    }
    async sendDirectMessage(text) {
        await this.client.chat.postMessage({
            channel: this.userId,
            text
        });
    }
}
