# NEXUS User Guide

This guide explains how to run NEXUS as a usable local research app with a browser dashboard and a browser extension.

## What You Get

NEXUS now has three user-facing pieces:

- Web dashboard: create research threads, inspect sources, run lit-watch, and view browser context.
- Browser extension: tracks open tabs, page titles, time on page, and reading progress.
- OpenClaw bridge: provides the real OpenClaw CLI/gateway integration for channel delivery and health checks.

## One-Time Setup

Install dependencies:

```powershell
npm install
npm install -g openclaw@latest
```

Verify OpenClaw:

```powershell
npm run openclaw:version
```

Build the project:

```powershell
npm run build
```

Initialize local NEXUS memory:

```powershell
npm run setup
```

This creates the local memory store at `~/.nexus/memory` unless `NEXUS_MEMORY_PATH` is set.

## Start The App

Use three terminals while developing locally.

Terminal 1: start OpenClaw gateway.

```powershell
npm run openclaw:gateway
```

Terminal 2: start the browser extension API bridge.

```powershell
npm run browser:bridge
```

Terminal 3: start NEXUS.

```powershell
npm start
```

Open the dashboard:

```text
http://localhost:8080
```

## Dashboard Workflow

In the dashboard you can:

- See OpenClaw, browser, thread, and source status.
- Create a research thread with title, keywords, priority, and watch sources.
- Select a thread from the sidebar.
- Run lit-watch manually.
- Inspect saved paper sources.
- View current browser tabs and reading progress.
- Save current browser tabs into the selected thread as sources.

Recommended first thread:

```text
Title: Retrieval Augmented Generation Evaluation
Keywords: rag evaluation, hallucination reduction, retrieval augmented generation
Watch: CORE
```

Then click `Run lit watch`.

To verify the dashboard without waiting on live browsing or APIs:

```powershell
npm run build
npm run demo:dashboard
```

Refresh `http://localhost:8080`. You should see a demo thread, demo CORE sources, and demo browser tabs.

## Browser Extension Setup

### Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `browser-extension/` folder in this repo.
5. Pin `NEXUS Bridge` to your toolbar.
6. Open a few research pages.
7. Click the extension icon and confirm the local bridge is online.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on`.
3. Select `browser-extension/manifest.json`.
4. Open a few research pages.
5. Visit the NEXUS dashboard at `http://localhost:8080`.

## Browser Extension Runtime

The extension sends snapshots to:

```text
http://localhost:9001/ingest
```

The local bridge exposes:

```text
http://localhost:9001/tabs
http://localhost:9001/history
```

The dashboard reads those through the NEXUS backend and displays them in the Browser Context panel.

If browser context is empty:

- Make sure `npm run browser:bridge` is running.
- Reload the extension.
- Browse or scroll a few pages.
- Wait up to one minute, or click `Sync now` in the extension popup.

To save visible browser tabs into a research thread:

1. Open the dashboard.
2. Select a thread in the sidebar.
3. Confirm tabs appear in `Browser Context`.
4. Click `Save tabs to thread`.
5. The selected thread's source list updates with `seen_in_browser` sources.

## OpenClaw Notes

OpenClaw is installed as both:

- A global CLI: `openclaw`
- A local project dependency: `openclaw`

NEXUS uses `src/tools/openclaw-cli.ts` to call the real CLI for:

```powershell
openclaw --version
openclaw health --json
openclaw message send --channel whatsapp ...
```

On Windows PowerShell, if `openclaw` is blocked by execution policy, use:

```powershell
openclaw.cmd --version
```

The project scripts call through npm, which worked in testing.

## WhatsApp Delivery

To enable WhatsApp delivery through OpenClaw:

1. Configure WhatsApp in OpenClaw.
2. Set these values in `.env`:

```env
WHATSAPP_ENABLED=true
WHATSAPP_RECIPIENT=+15555550123
```

3. Restart NEXUS.

NEXUS will send WhatsApp messages via:

```powershell
openclaw message send --channel whatsapp --target <recipient> --message <text>
```

## Health Check

Run:

```powershell
npm run build
npm run health-check
```

Expected when everything is running:

```text
OK OpenClaw CLI
OK OpenClaw gateway
OK NEXUS gateway
OK Browser extension
OK Memory layer
```

If a gateway or extension line fails, start the missing service and run the check again.

## Common Commands

```powershell
npm run build
npm start
npm run setup
npm run thread:create
npm run browser:bridge
npm run demo:dashboard
npm run openclaw:gateway
npm run health-check
npm test
```

## Push-Ready Notes

Do not commit `.env`, `node_modules/`, `dist/`, or browser runtime state. They are ignored by `.gitignore`.

Commit the source files, dashboard files, extension files, docs, `package.json`, and `package-lock.json`.
