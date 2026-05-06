import path from "path";
import { ConnectionsSchema } from "./schema.js";
import { withFileLock } from "../utils/lock.js";
import { readYamlFile, writeYamlFile } from "../utils/yaml-utils.js";
export class ConnectionStore {
    connectionsPath;
    logger;
    constructor(memoryPath, logger) {
        this.connectionsPath = path.join(memoryPath, "_connections.yaml");
        this.logger = logger;
    }
    async load() {
        return readYamlFile(this.connectionsPath, ConnectionsSchema);
    }
    async save(connections) {
        await withFileLock(this.connectionsPath, () => writeYamlFile(this.connectionsPath, connections));
    }
    async addConnection(connection) {
        await withFileLock(this.connectionsPath, async () => {
            const current = await this.load();
            const updated = {
                connections: [...current.connections, connection]
            };
            await this.save(updated);
            this.logger.info("Connection added", { connectionId: connection.id });
        });
    }
    async listUnsurfaced() {
        const current = await this.load();
        return current.connections.filter((connection) => !connection.surfaced_to_user);
    }
}
