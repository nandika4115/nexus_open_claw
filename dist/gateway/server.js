import http from "http";
import express from "express";
import { WebSocketServer } from "ws";
import { authorizeRequest } from "./auth.js";
export class GatewayServer {
    logger;
    router;
    config;
    server;
    wss;
    constructor(logger, router, config) {
        this.logger = logger;
        this.router = router;
        this.config = config;
    }
    start() {
        const app = express();
        app.get("/health", (_req, res) => {
            res.json({ ok: true });
        });
        this.server = http.createServer(app);
        this.wss = new WebSocketServer({ noServer: true });
        this.server.on("upgrade", (request, socket, head) => {
            if (!authorizeRequest(request, { apiKey: this.config.apiKey })) {
                socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                socket.destroy();
                return;
            }
            this.wss?.handleUpgrade(request, socket, head, (ws) => {
                this.wss?.emit("connection", ws, request);
            });
        });
        this.wss.on("connection", (ws) => {
            ws.on("message", async (data) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    await this.router.handleMessage(parsed);
                }
                catch (error) {
                    this.logger.warn("Gateway message error", { error: error.message });
                }
            });
        });
        this.server.listen(this.config.port, () => {
            this.logger.info("Gateway listening", { port: this.config.port });
        });
    }
    stop() {
        this.wss?.close();
        this.server?.close();
    }
}
