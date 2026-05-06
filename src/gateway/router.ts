import type { Logger } from "winston";

import type { EngineSignal } from "../engine/types.js";

export interface GatewayMessage {
  type: string;
  payload?: Record<string, unknown>;
}

export class GatewayRouter {
  private readonly logger: Logger;
  private readonly dispatch: (signal: EngineSignal) => Promise<void>;

  constructor(logger: Logger, dispatch: (signal: EngineSignal) => Promise<void>) {
    this.logger = logger;
    this.dispatch = dispatch;
  }

  async handleMessage(message: GatewayMessage): Promise<void> {
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
