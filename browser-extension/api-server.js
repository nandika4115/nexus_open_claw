import express from "express";
import fs from "fs/promises";
import path from "path";

const app = express();
const port = Number(process.env.BROWSER_EXT_PORT ?? "9001");
const statePath = path.join(process.cwd(), "browser-extension", "state.json");
let cached = { tabs: [], history: [], lastUpdated: null };

app.use(express.json({ limit: "2mb" }));

app.post("/ingest", async (req, res) => {
  const { tabs, history, timestamp } = req.body ?? {};
  cached = {
    tabs: Array.isArray(tabs) ? tabs : [],
    history: Array.isArray(history) ? history : [],
    lastUpdated: timestamp ?? new Date().toISOString()
  };
  await fs.writeFile(statePath, JSON.stringify(cached, null, 2), "utf8");
  res.json({ ok: true });
});

app.get("/tabs", (_req, res) => {
  res.json(cached.tabs);
});

app.get("/history", (req, res) => {
  const since = req.query.since ? new Date(String(req.query.since)).getTime() : 0;
  const filtered = cached.history.filter((entry) => new Date(entry.visitedAt).getTime() >= since);
  res.json(filtered);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`NEXUS browser API listening on http://localhost:${port}`);
});
