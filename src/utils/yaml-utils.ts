import yaml from "js-yaml";
import type { z } from "zod";

import { atomicWriteFile, readFileIfExists } from "./fs-utils.js";

export async function readYamlFile<TSchema extends z.ZodTypeAny>(
  filePath: string,
  schema: TSchema
): Promise<z.output<TSchema>> {
  const raw = await readFileIfExists(filePath);
  if (!raw) {
    throw new Error(`YAML file not found: ${filePath}`);
  }
  const parsed = yaml.load(raw);
  return schema.parse(parsed);
}

export async function writeYamlFile<T>(filePath: string, data: T): Promise<void> {
  const contents = yaml.dump(data, { noRefs: true, lineWidth: 120 });
  await atomicWriteFile(filePath, contents);
}
