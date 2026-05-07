import { OpenClawCli } from "../tools/openclaw-cli.js";

export class WhatsAppChannel {
  private readonly openclaw: OpenClawCli;
  private readonly recipient?: string;

  constructor(options: { openclaw?: OpenClawCli; recipient?: string } = {}) {
    this.openclaw = options.openclaw ?? new OpenClawCli();
    this.recipient = options.recipient;
  }

  async send(text: string): Promise<void> {
    if (!this.recipient) {
      throw new Error("WhatsApp recipient is not configured. Set WHATSAPP_RECIPIENT.");
    }

    const result = await this.openclaw.sendMessage({
      channel: "whatsapp",
      target: this.recipient,
      message: text
    });

    if (!result.ok) {
      throw new Error(result.stderr || result.stdout || "OpenClaw WhatsApp send failed");
    }
  }
}
