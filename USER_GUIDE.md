# mnemochron User Guide

This guide explains how to run `mnemochron` as a usable local research app with a browser dashboard and a browser extension.

## What You Get

`mnemochron` now has three user-facing pieces:

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

Initialize local mnemochron memory:

```powershell
npm run setup
```

This creates the local memory store at `~/.mnemochron/memory` unless `MNEMOCHRON_MEMORY_PATH` is set.

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

Terminal 3: start mnemochron.

```powershell
npm start
```

Open the dashboard:

```text
http://localhost:8080
```

## Single-command run

You can run the full demo (install/build/start bridge + server and run demo scripts) with a single script. From the repository root:

```bash
chmod +x scripts/run_all.sh
./scripts/run_all.sh
```

The default command is a dry run and does not deliver WhatsApp messages. To send the WhatsApp summary and full report PDF, run:

```bash
./scripts/run_all.sh --send-whatsapp
```

Common options:

- `--no-install` : skip `npm ci` (useful if you already installed dependencies)
- `--no-build` : skip `npm run build`
- `--send-whatsapp` : send the WhatsApp summary and full report PDF
- `--no-openclaw` : do not check/start the OpenClaw gateway
- `--no-bridge` : do not start the browser bridge
- `--no-server` : do not start the main server
- `--no-demo-browser` : skip `npm run demo:browser`
- `--no-demo-user` : skip `npm run demo:user`
- `--no-judge-demo` : skip the judge demo flow
- `--no-report-pdf` : skip generating `logs/judge-demo-report.pdf`

Logs for the run are written to `logs/run_all_<timestamp>`; the script leaves background services running so you can inspect them. Press Ctrl+C to stop background services and exit the script.

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

## Fake User Process

To fake the full user flow from browser visits to dashboard sources and OpenClaw notifications, keep the three local services running:

```powershell
npm run openclaw:gateway
npm run browser:bridge
npm start
```

Then run:

```powershell
npm run demo:user
```

This safely simulates tab visits, imports those tabs into the active dashboard thread, and calls OpenClaw WhatsApp/iMessage in dry-run mode. Nothing is delivered unless you explicitly use `--send`.

If WhatsApp is not configured in OpenClaw yet, dry-run shows a channel warning and continues. Real sends require the OpenClaw WhatsApp channel to be available.

The script reads recipient details from `.env` by default:

```env
WHATSAPP_RECIPIENT=<E164_PHONE_NUMBER>
WHATSAPP_DEFAULT_COUNTRY_CODE=
IMESSAGE_RECIPIENT=<E164_PHONE_NUMBER_OR_APPLE_ID>
```

To test target formatting without sending, keep those values in `.env` and run:

```powershell
npm run demo:user
```

To actually send through OpenClaw after WhatsApp/iMessage are configured:

```powershell
npm run demo:user:send
```

CLI target flags still exist for temporary overrides, but `.env` is the normal path:

```powershell
npm run demo:user -- --whatsapp-target "<E164_PHONE_NUMBER>" --imessage-target "<E164_PHONE_NUMBER_OR_APPLE_ID>"
```

Useful options:

```powershell
npm run demo:user -- --steps 12 --interval 0.5
npm run demo:user -- --thread retrieval-augmented-generation-evaluation
npm run demo:user -- --skip-browser
```

## Judge Demo

Use this for a presentation-ready demo that simulates extension activity, imports browser sources into a dashboard thread, and sends a WhatsApp report through OpenClaw.

The script reads `WHATSAPP_RECIPIENT` from `.env`. Use full E.164 format with the country code:

```env
WHATSAPP_RECIPIENT=<E164_PHONE_NUMBER>
```

Safe dry-run:

```powershell
npm run demo:judge
```

Live presentation mode, keeping the dashboard and bridge running afterward:

```powershell
npm run demo:judge:live
```

Actual WhatsApp delivery:

```powershell
npm run demo:judge:send
```

Full shell automation:

```powershell
./scripts/run_all.sh --send-whatsapp
```

This starts the local services, runs the browser/user/judge demos, generates `logs/judge-demo-report.pdf`, sends the WhatsApp summary, and sends the full PDF report. Omit `--send-whatsapp` for a dry run.

Useful flags:

```powershell
npm run demo:judge -- --steps 12 --interval 0.5
npm run demo:judge -- --skip-build
npm run demo:judge -- --target "<E164_PHONE_NUMBER>"
npm run demo:judge:send -- --keep-services
```

The demo writes the full run report to:

```text
logs/judge-demo-report.json
```

WhatsApp text messages may truncate or fail to render long JSON cleanly. To send the full report as an attachment, convert it to a PDF and send the PDF:

```powershell
npm run demo:judge:pdf
openclaw.cmd message send --channel whatsapp --target "<E164_PHONE_NUMBER>" --message "Full NEXUS judge demo JSON report attached as PDF." --media .\logs\judge-demo-report.pdf --json
```

## Browser Extension Setup

### Chrome

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `browser-extension/` folder in this repo.
5. Pin `mnemochron Bridge` to your toolbar.
6. Open a few research pages.
7. Click the extension icon and confirm the local bridge is online.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on`.
3. Select `browser-extension/manifest.json`.
4. Open a few research pages.
5. Visit the mnemochron dashboard at `http://localhost:8080`.

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

The dashboard reads those through the mnemochron backend and displays them in the Browser Context panel.

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

`mnemochron` uses `src/tools/openclaw-cli.ts` to call the real CLI for:

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

1. Link WhatsApp in OpenClaw:

```powershell
openclaw.cmd channels login --channel whatsapp --verbose
```

Scan the QR from WhatsApp `Linked devices`.

2. Set these values in `.env`:

```env
WHATSAPP_ENABLED=true
WHATSAPP_RECIPIENT=<E164_PHONE_NUMBER>
WHATSAPP_DEFAULT_COUNTRY_CODE=
```

Use the full phone number with country code. A local number without country code may route to the wrong recipient. If you want the automation to normalize local 10-digit numbers, set `WHATSAPP_DEFAULT_COUNTRY_CODE` in `.env`.

3. Confirm OpenClaw can see WhatsApp:

```powershell
openclaw.cmd gateway health
```

Expected:

```text
WhatsApp: linked
```

4. Restart mnemochron if `.env` changed.

`mnemochron` will send WhatsApp messages via:

```powershell
openclaw message send --channel whatsapp --target <recipient> --message <text>
```

To send a report file, use `--media` with an allowed document type such as PDF:

```powershell
openclaw.cmd message send --channel whatsapp --target "<E164_PHONE_NUMBER>" --message "Report attached." --media .\logs\judge-demo-report.pdf --json
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
OK mnemochron gateway
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
npm run demo:judge
npm run demo:judge:live
npm run demo:judge:send
npm run demo:judge:pdf
npm run openclaw:gateway
npm run health-check
npm test
```

## Push-Ready Notes

Do not commit `.env`, `node_modules/`, `dist/`, or browser runtime state. They are ignored by `.gitignore`.

Commit the source files, dashboard files, extension files, docs, `package.json`, and `package-lock.json`.
