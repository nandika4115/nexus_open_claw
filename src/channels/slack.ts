import { WebClient } from "@slack/web-api";

export class SlackChannel {
  private readonly client: WebClient;
  private readonly userId: string;

  constructor(token: string, userId: string) {
    this.client = new WebClient(token);
    this.userId = userId;
  }

  async sendDirectMessage(text: string): Promise<void> {
    await this.client.chat.postMessage({
      channel: this.userId,
      text
    });
  }
}
