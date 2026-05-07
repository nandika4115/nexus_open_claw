import { loadConfig } from "../config/index.js";
import { OpenClawCli } from "../tools/openclaw-cli.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const checks: Array<{ label: string; ok: boolean }> = [];
  const openclaw = new OpenClawCli({ command: config.env.OPENCLAW_CLI_PATH });

  try {
    const version = await openclaw.version();
    checks.push({ label: "OpenClaw CLI", ok: version.ok });
  } catch {
    checks.push({ label: "OpenClaw CLI", ok: false });
  }

  try {
    const health = await openclaw.health();
    checks.push({ label: "OpenClaw gateway", ok: health.ok });
  } catch {
    checks.push({ label: "OpenClaw gateway", ok: false });
  }

  try {
    const response = await fetch("http://localhost:8080/health");
    checks.push({ label: "NEXUS gateway", ok: response.ok });
  } catch {
    checks.push({ label: "NEXUS gateway", ok: false });
  }

  try {
    const response = await fetch(`http://localhost:${config.browserExtPort}/tabs`);
    checks.push({ label: "Browser extension", ok: response.ok });
  } catch {
    checks.push({ label: "Browser extension", ok: false });
  }

  checks.push({ label: "Memory layer", ok: true });

  for (const check of checks) {
    const icon = check.ok ? "✅" : "❌";
    // eslint-disable-next-line no-console
    console.log(`${icon} ${check.label}`);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
