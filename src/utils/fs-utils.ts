import fs from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export function expandHome(inputPath: string): string {
  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

export async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function atomicWriteFile(filePath: string, contents: string): Promise<void> {
  const dirPath = path.dirname(filePath);
  await ensureDir(dirPath);
  const tempPath = path.join(dirPath, `.tmp-${randomUUID()}`);
  await fs.writeFile(tempPath, contents, "utf8");
  await fs.rename(tempPath, filePath);
}
