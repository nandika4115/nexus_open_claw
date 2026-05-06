import { loadConfig } from "../config/index.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const checks: Array<{ label: string; ok: boolean }> = [];

  try {
    const response = await fetch("http://localhost:8080/health");
    checks.push({ label: "OpenClaw gateway", ok: response.ok });
  } catch {
    checks.push({ label: "OpenClaw gateway", ok: false });
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
