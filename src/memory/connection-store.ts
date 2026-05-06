import path from "path";

import type { Logger } from "winston";

import type { ConnectionsFile, Connection } from "./schema.js";
import { ConnectionsSchema } from "./schema.js";
import { withFileLock } from "../utils/lock.js";
import { readYamlFile, writeYamlFile } from "../utils/yaml-utils.js";

export class ConnectionStore {
  private readonly connectionsPath: string;
  private readonly logger: Logger;

  constructor(memoryPath: string, logger: Logger) {
    this.connectionsPath = path.join(memoryPath, "_connections.yaml");
    this.logger = logger;
  }

  async load(): Promise<ConnectionsFile> {
    return readYamlFile(this.connectionsPath, ConnectionsSchema);
  }

  async save(connections: ConnectionsFile): Promise<void> {
    await withFileLock(this.connectionsPath, () => writeYamlFile(this.connectionsPath, connections));
  }

  async addConnection(connection: Connection): Promise<void> {
    await withFileLock(this.connectionsPath, async () => {
      const current = await this.load();
      const updated: ConnectionsFile = {
        connections: [...current.connections, connection]
      };
      await this.save(updated);
      this.logger.info("Connection added", { connectionId: connection.id });
    });
  }

  async listUnsurfaced(): Promise<Connection[]> {
    const current = await this.load();
    return current.connections.filter((connection) => !connection.surfaced_to_user);
  }
}
