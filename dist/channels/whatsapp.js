export class WhatsAppChannel {
    async send(_text) {
        throw new Error("WhatsApp channel is not configured. Enable the OpenClaw WhatsApp bridge before use.");
    }
}
