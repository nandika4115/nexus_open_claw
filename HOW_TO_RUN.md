# HOW TO RUN NEXUS

This guide covers setup and how to run every major component:

- Core NEXUS runtime (gateway + heartbeat + behaviors)
- Browser extension API bridge
- Browser extension (Chrome/Firefox)
- Health checks
- Thread creation
- Tests
- Docker

## 1) Prerequisites

- Node.js >= 22
- npm >= 10
- Git
- OpenClaw CLI
- (Optional) Docker + Docker Compose

## 2) Repository Setup

```bash
git clone https://github.com/nandika4115/nexus_open_claw.git
cd nexus_open_claw
npm install -g openclaw@latest
npm install
cp .env.example .env
```

Fill out `.env` with your API keys and config values.

Verify the real OpenClaw CLI is available:

```bash
npm run openclaw:version
```

On Windows PowerShell, call `openclaw.cmd` directly if your execution policy blocks the `.ps1` shim.

## 3) Initialize Memory (First Run)

```bash
npm run build
npm run setup
```

This creates the memory directory and the required YAML/MD files under:

```
~/.nexus/memory
```

## 4) Start the Browser API Bridge

The browser extension writes tab state to a local API server. Start it in a separate terminal:

```bash
node browser-extension/api-server.js
```

Expected log:

```
NEXUS browser API listening on http://localhost:9001
```

## 5) Install the Browser Extension

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select the `browser-extension/` folder.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `browser-extension/manifest.json`.

## 6) Run the NEXUS Runtime

If you want the OpenClaw gateway available for channel delivery and health checks, start it in a separate terminal:

```bash
npm run openclaw:gateway
```

In a new terminal:

```bash
npm start
```

Expected logs include:

- Gateway listening on port 8080
- Heartbeat starting and a first tick

## 7) Health Check

```bash
npm run health-check
```

Expected output:

```
✅ OpenClaw gateway
✅ Browser extension
✅ Memory layer
```

With the real OpenClaw integration, the health check now also reports OpenClaw CLI availability and the local NEXUS gateway separately. Gateway/browser lines can fail if those processes are not running.

## 8) Create a Research Thread

```bash
npm run thread:create
```

Follow the prompts to create an initial thread.

## 9) Run Tests

```bash
npm test
```

Note: Jest runs in ESM mode; you may see an experimental VM modules warning.

## 10) Run With Docker (Optional)

```bash
docker-compose up -d
```

This runs the NEXUS runtime in a container. You still need to run:

- The browser API bridge on the host
- The browser extension in your browser

## 11) Daily Digest Export (Optional)

```bash
npm run build
node dist/scripts/export-digest.js
```

Or via shell script:

```bash
./scripts/export-digest.sh
```

## 12) Common Issues

### Missing memory files

Run:

```bash
npm run setup
```

### Browser extension not detected

Ensure:

- `browser-extension/api-server.js` is running
- Extension is loaded in the browser
- Port `9001` is free

### LLM errors

Check `.env` for `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` and confirm network access.
