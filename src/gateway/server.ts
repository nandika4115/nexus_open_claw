import http from "http";

import express from "express";
import type { Request, Response } from "express";
import type { Logger } from "winston";
import WebSocket, { WebSocketServer } from "ws";

import { authorizeRequest } from "./auth.js";
import type { GatewayMessage } from "./router.js";
import { GatewayRouter } from "./router.js";

export interface GatewayServerConfig {
  port: number;
  apiKey?: string;
  configureApp?: (app: express.Express) => void;
}

export class GatewayServer {
  private readonly logger: Logger;
  private readonly router: GatewayRouter;
  private readonly config: GatewayServerConfig;
  private server?: http.Server;
  private wss?: WebSocketServer;

  constructor(logger: Logger, router: GatewayRouter, config: GatewayServerConfig) {
    this.logger = logger;
    this.router = router;
    this.config = config;
  }

  start(): void {
    const app = express();
    app.use(express.json({ limit: "2mb" }));

    app.get("/health", (_req: Request, res: Response) => {
      res.json({ ok: true });
    });
    this.config.configureApp?.(app);

    this.server = http.createServer(app);
    this.wss = new WebSocketServer({ noServer: true });

    this.server.on("upgrade", (request, socket, head) => {
      if (!authorizeRequest(request, { apiKey: this.config.apiKey })) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      this.wss?.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        this.wss?.emit("connection", ws, request);
      });
    });

    this.wss.on("connection", (ws: WebSocket) => {
      ws.on("message", async (data: WebSocket.RawData) => {
        try {
          const parsed = JSON.parse(data.toString()) as GatewayMessage;
          await this.router.handleMessage(parsed);
        } catch (error) {
          this.logger.warn("Gateway message error", { error: (error as Error).message });
        }
      });
    });

    this.server.listen(this.config.port, () => {
      this.logger.info("Gateway listening", { port: this.config.port });
    });
  }

  stop(): void {
    this.wss?.close();
    this.server?.close();
  }
}
