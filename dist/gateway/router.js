export class GatewayRouter {
    logger;
    dispatch;
    constructor(logger, dispatch) {
        this.logger = logger;
        this.dispatch = dispatch;
    }
    async handleMessage(message) {
        if (message.type === "external_event") {
            await this.dispatch({
                type: "external_event",
                timestamp: new Date().toISOString(),
                payload: message.payload
            });
            return;
        }
        this.logger.warn("Unknown gateway message", { type: message.type });
    }
}
