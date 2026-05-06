import yaml from "js-yaml";
import { atomicWriteFile, readFileIfExists } from "./fs-utils.js";
export async function readYamlFile(filePath, schema) {
    const raw = await readFileIfExists(filePath);
    if (!raw) {
        throw new Error(`YAML file not found: ${filePath}`);
    }
    const parsed = yaml.load(raw);
    return schema.parse(parsed);
}
export async function writeYamlFile(filePath, data) {
    const contents = yaml.dump(data, { noRefs: true, lineWidth: 120 });
    await atomicWriteFile(filePath, contents);
}
