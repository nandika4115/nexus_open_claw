import { RuntimeConfigSchema } from "../memory/schema.js";
import { readYamlFile } from "../utils/yaml-utils.js";
export async function loadRuntimeConfig(configPath) {
    return readYamlFile(configPath, RuntimeConfigSchema);
}
export { RuntimeConfigSchema };
