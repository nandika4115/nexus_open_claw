import { z } from "zod";

import type { RuntimeConfig } from "../memory/schema.js";
import { RuntimeConfigSchema } from "../memory/schema.js";
import { readYamlFile } from "../utils/yaml-utils.js";

export async function loadRuntimeConfig(configPath: string): Promise<RuntimeConfig> {
  return readYamlFile(configPath, RuntimeConfigSchema);
}

export { RuntimeConfigSchema };
export type { RuntimeConfig };
