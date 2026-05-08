# mnemochron + OpenClaw Architecture

This project is a mnemochron research agent built around an internal mnemochron engine, with the real OpenClaw runtime available as the external gateway and channel tooling layer.

`mnemochron` handles research memory, scheduled behaviors, literature watch, thread tracking, and summaries. OpenClaw is used as the installed runtime/CLI for gateway checks and channel delivery, especially WhatsApp.

## Startup Flow

`src/index.ts` is the main entry point.

When you run:

```powershell
npm run build
npm start
```

the app:

1. Loads `.env` through `src/config/env.ts`.
2. Loads runtime memory config from `_config.yaml`.
3. Opens the local memory store.
4. Starts optional watchers, such as file watching and clipboard monitoring.
5. Creates tool clients for browser state, arXiv, CORE, Semantic Scholar, LLMs, and OpenClaw.
6. Creates delivery channels for desktop, Slack, iMessage, WhatsApp, and email.
7. Registers behaviors into the internal `PiEngine`.
8. Starts the mnemochron HTTP/WebSocket gateway on port `8080`.
9. Starts the heartbeat daemon.

## Internal Engine

The internal agent loop is:

```text
Signal -> Planner -> Behavior -> Memory/Tools/Channels
```

Important files:

- `src/engine/pi-engine.ts`
- `src/engine/planner.ts`
- `src/engine/heartbeat.ts`

The heartbeat creates scheduled signals. The planner decides which behavior should run. The engine executes that behavior.

Example:

```text
daily_schedule: lit_watch
        ↓
Planner selects lit_watch
        ↓
lit-watch behavior queries CORE/arXiv/etc.
        ↓
new papers are saved into sources.yaml
```

## Memory

`mnemochron` stores research state locally as files. Setup creates a memory directory, usually:

```text
~/.mnemochron/memory
```

Important memory files:

```text
_index.yaml
_connections.yaml
threads/<slug>/thread.md
threads/<slug>/insights.md
threads/<slug>/questions.md
threads/<slug>/sources.yaml
threads/<slug>/sessions/
```

A thread is a research topic. Each topic has keywords, sources, notes, questions, and snapshots.

## Literature Watch

The `lit_watch` behavior lives in:

```text
src/skills/lit-watch.ts
```

It checks each thread that has `watch_sources`.

Supported sources:

```text
arxiv
core
semantic_scholar
```

CORE support is implemented in:

```text
src/tools/core-client.ts
```

That client calls the CORE API, maps papers into a normalized format, and `lit-watch` saves them into:

```text
threads/<thread-slug>/sources.yaml
```

## OpenClaw Integration

OpenClaw is installed and added as a real dependency:

```text
openclaw@2026.5.6
```

The adapter is:

```text
src/tools/openclaw-cli.ts
```

It wraps commands like:

```powershell
openclaw --version
openclaw health --json
openclaw message send --channel whatsapp ...
```

So mnemochron can use the real OpenClaw CLI instead of only mentioning OpenClaw in documentation.

The WhatsApp channel uses OpenClaw here:

```text
src/channels/whatsapp.ts
```

If enabled, mnemochron sends WhatsApp messages through:

```powershell
openclaw message send --channel whatsapp --target <recipient> --message <text>
```

## Health Check

The health check is:

```text
src/scripts/health-check.ts
```

It checks:

```text
OpenClaw CLI
OpenClaw gateway
mnemochron gateway
Browser extension
Memory layer
```

Run it with:

```powershell
npm run build
npm run health-check
```

If the OpenClaw gateway is down, start it with:

```powershell
npm run openclaw:gateway
```

## Browser Extension

The browser extension lives in:

```text
browser-extension/
```

Its API bridge runs locally on port `9001`. mnemochron uses it to inspect browser tabs and infer what research thread may be active.

Start it with:

```powershell
node browser-extension/api-server.js
```

Then load the extension in Chrome or Firefox.

## Typical Workflow

Install dependencies:

```powershell
npm install
npm install -g openclaw@latest
```

Build:

```powershell
npm run build
```

Initialize memory:

```powershell
npm run setup
```

Start OpenClaw gateway:

```powershell
npm run openclaw:gateway
```

Start browser bridge:

```powershell
node browser-extension/api-server.js
```

Start mnemochron:

```powershell
npm start
```

Create a research thread:

```powershell
npm run thread:create
```

## Summary

OpenClaw is the external gateway and channel runtime. mnemochron is the research-specific brain layered on top: memory, literature discovery, session tracking, and research continuity.
