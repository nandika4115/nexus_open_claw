import fs from "fs/promises";
import path from "path";

import { loadConfig } from "../config/index.js";
import { formatDateStamp } from "../utils/time.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const date = formatDateStamp();
  const briefingPath = path.join(config.memoryPath, "briefings", `${date}-morning.md`);
  const digestPath = path.join(config.memoryPath, "digests", "daily", `${date}.md`);

  const briefing = await fs.readFile(briefingPath, "utf8");
  await fs.writeFile(digestPath, briefing, "utf8");

  // eslint-disable-next-line no-console
  console.log(`Digest exported to ${digestPath}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
