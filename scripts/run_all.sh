#!/usr/bin/env bash
set -euo pipefail

# Run the full project: install, build, start services, run demos, generate the
# judge report, and optionally send the WhatsApp summary + full report PDF.
# Usage: ./scripts/run_all.sh [--send-whatsapp] [--no-install] [--no-build] [--no-openclaw] [--no-bridge] [--no-server] [--no-demo-browser] [--no-demo-user] [--no-judge-demo] [--no-report-pdf]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

DO_INSTALL=1
DO_BUILD=1
DO_OPENCLAW=1
DO_BRIDGE=1
DO_SERVER=1
DO_DEMO_BROWSER=1
DO_DEMO_USER=1
DO_JUDGE_DEMO=1
DO_REPORT_PDF=1
SEND_WHATSAPP=0

usage() {
  echo "Usage: $0 [--send-whatsapp] [--no-install] [--no-build] [--no-openclaw] [--no-bridge] [--no-server] [--no-demo-browser] [--no-demo-user] [--no-judge-demo] [--no-report-pdf]"
  echo
  echo "Default mode is safe: WhatsApp calls use dry-run. Add --send-whatsapp to deliver the summary and full report PDF."
}

wait_for_openclaw_health() {
  local max_attempts="${1:-12}"
  local delay_seconds="${2:-10}"
  local attempt=1

  while [ "$attempt" -le "$max_attempts" ]; do
    if "$OPENCLAW_BIN" gateway health >>"$LOG_DIR/openclaw-health.log" 2>&1; then
      return 0
    fi
    echo "OpenClaw gateway not healthy yet (attempt $attempt/$max_attempts); waiting ${delay_seconds}s..."
    sleep "$delay_seconds"
    attempt=$((attempt + 1))
  done

  return 1
}

for arg in "$@"; do
  case "$arg" in
    --no-install) DO_INSTALL=0 ;;
    --no-build) DO_BUILD=0 ;;
    --no-openclaw) DO_OPENCLAW=0 ;;
    --no-bridge) DO_BRIDGE=0 ;;
    --no-server) DO_SERVER=0 ;;
    --no-demo-browser) DO_DEMO_BROWSER=0 ;;
    --no-demo-user) DO_DEMO_USER=0 ;;
    --no-judge-demo) DO_JUDGE_DEMO=0 ;;
    --no-report-pdf) DO_REPORT_PDF=0 ;;
    --send-whatsapp) SEND_WHATSAPP=1 ;;
    -h|--help)
      usage
      exit 0
      ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_DIR="$ROOT_DIR/logs/run_all_$TIMESTAMP"
mkdir -p "$LOG_DIR"

PIDS=()
cleanup() {
  echo "Stopping background processes..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" || true
    fi
  done
}
trap cleanup EXIT

read_env_value() {
  local key="$1"
  if [ -f "$ROOT_DIR/.env" ]; then
    grep -E "^${key}=" "$ROOT_DIR/.env" | tail -n 1 | cut -d= -f2- | tr -d '"' | tr -d '\r'
  fi
}

pick_openclaw_bin() {
  local configured
  configured="$(read_env_value OPENCLAW_CLI_PATH || true)"
  configured="${configured//\\//}"
  if [ -n "${OPENCLAW_CLI_PATH:-}" ]; then
    echo "${OPENCLAW_CLI_PATH//\\//}"
  elif [ -n "$configured" ]; then
    echo "$configured"
  elif command -v openclaw.cmd >/dev/null 2>&1; then
    echo "openclaw.cmd"
  else
    echo "openclaw"
  fi
}

normalize_whatsapp_target() {
  local raw="$1"
  local default_country_code="${2:-}"
  local digits
  local country_digits
  digits="$(printf '%s' "$raw" | tr -cd '0-9')"
  country_digits="$(printf '%s' "$default_country_code" | tr -cd '0-9')"
  if [[ "$raw" == +* ]]; then
    printf '+%s' "$digits"
  elif [ "${#digits}" -eq 10 ] && [ -n "$country_digits" ]; then
    printf '+%s%s' "$country_digits" "$digits"
  elif [ "${#digits}" -gt 10 ]; then
    printf '+%s' "$digits"
  else
    printf '%s' "$raw"
  fi
}

OPENCLAW_BIN="$(pick_openclaw_bin)"
OPENCLAW_PORT="${OPENCLAW_GATEWAY_PORT:-$(read_env_value OPENCLAW_GATEWAY_PORT || true)}"
OPENCLAW_PORT="${OPENCLAW_PORT:-18789}"
WHATSAPP_TARGET="${WHATSAPP_RECIPIENT:-$(read_env_value WHATSAPP_RECIPIENT || true)}"
WHATSAPP_DEFAULT_COUNTRY_CODE="${WHATSAPP_DEFAULT_COUNTRY_CODE:-$(read_env_value WHATSAPP_DEFAULT_COUNTRY_CODE || true)}"
WHATSAPP_TARGET="$(normalize_whatsapp_target "$WHATSAPP_TARGET" "$WHATSAPP_DEFAULT_COUNTRY_CODE")"

if [ "$DO_INSTALL" -eq 1 ]; then
  echo "Installing dependencies (npm ci)..."
  if command -v npm >/dev/null 2>&1; then
    npm ci
  else
    echo "npm not found on PATH; aborting." >&2
    exit 1
  fi
fi

if [ "$DO_BUILD" -eq 1 ]; then
  echo "Building TypeScript artifacts..."
  npm run build
fi

if [ "$DO_OPENCLAW" -eq 1 ]; then
  echo "Checking OpenClaw gateway..."
  if "$OPENCLAW_BIN" gateway health >"$LOG_DIR/openclaw-health.log" 2>&1; then
    echo "OpenClaw gateway is already healthy."
  else
    echo "Starting OpenClaw gateway (background), logs -> $LOG_DIR/openclaw-gateway.log"
    "$OPENCLAW_BIN" gateway run --port "$OPENCLAW_PORT" --force >"$LOG_DIR/openclaw-gateway.log" 2>&1 &
    PIDS+=("$!")
    if wait_for_openclaw_health 12 10; then
      echo "OpenClaw gateway is healthy."
    else
      echo "OpenClaw gateway health failed after waiting (see $LOG_DIR/openclaw-health.log and $LOG_DIR/openclaw-gateway.log)"
    fi
  fi
fi

if [ "$DO_BRIDGE" -eq 1 ]; then
  echo "Starting browser bridge (background), logs -> $LOG_DIR/browser-bridge.log"
  npm run browser:bridge >"$LOG_DIR/browser-bridge.log" 2>&1 &
  PIDS+=("$!")
  sleep 1
fi

if [ "$DO_SERVER" -eq 1 ]; then
  echo "Starting server (background), logs -> $LOG_DIR/server.log"
  npm start >"$LOG_DIR/server.log" 2>&1 &
  PIDS+=("$!")
  sleep 2
fi

echo "Waiting a few seconds for services to initialize..."
sleep 5

if [ "$DO_DEMO_BROWSER" -eq 1 ]; then
  echo "Running demo browser activity (demo:browser), log -> $LOG_DIR/demo-browser.log"
  npm run demo:browser >"$LOG_DIR/demo-browser.log" 2>&1 || echo "demo:browser failed (see log)"
fi

if [ "$DO_DEMO_USER" -eq 1 ]; then
  echo "Running fake user process (demo:user), log -> $LOG_DIR/demo-user.log"
  npm run demo:user >"$LOG_DIR/demo-user.log" 2>&1 || echo "demo:user failed (see log)"
fi

if [ "$DO_JUDGE_DEMO" -eq 1 ]; then
  if [ "$SEND_WHATSAPP" -eq 1 ]; then
    echo "Running judge demo with real WhatsApp send, log -> $LOG_DIR/judge-demo.log"
    npm run demo:judge:send -- --no-start --skip-build --target "$WHATSAPP_TARGET" >"$LOG_DIR/judge-demo.log" 2>&1 || echo "demo:judge:send failed (see log)"
  else
    echo "Running judge demo dry-run, log -> $LOG_DIR/judge-demo.log"
    npm run demo:judge -- --no-start --skip-build >"$LOG_DIR/judge-demo.log" 2>&1 || echo "demo:judge failed (see log)"
  fi
fi

if [ "$DO_REPORT_PDF" -eq 1 ]; then
  echo "Generating judge report PDF, log -> $LOG_DIR/judge-report-pdf.log"
  npm run demo:judge:pdf >"$LOG_DIR/judge-report-pdf.log" 2>&1 || echo "demo:judge:pdf failed (see log)"
fi

if [ "$DO_REPORT_PDF" -eq 1 ]; then
  if [ "$SEND_WHATSAPP" -eq 1 ]; then
    if [ -z "$WHATSAPP_TARGET" ]; then
      echo "WHATSAPP_RECIPIENT is missing; full report PDF was not sent." >&2
    else
      echo "Sending full judge report PDF to $WHATSAPP_TARGET, log -> $LOG_DIR/judge-report-whatsapp.log"
      "$OPENCLAW_BIN" message send \
        --channel whatsapp \
        --target "$WHATSAPP_TARGET" \
        --message "Full mnemochron judge demo JSON report attached as PDF." \
        --media "$ROOT_DIR/logs/judge-demo-report.pdf" \
        --json >"$LOG_DIR/judge-report-whatsapp.log" 2>&1 || echo "full report WhatsApp send failed (see log)"
    fi
  else
    echo "Dry run only: WhatsApp messages were NOT sent. Re-run with --send-whatsapp to deliver the summary and full PDF report."
  fi
fi

echo "All requested tasks finished. Background PIDs: ${PIDS[*]}"
echo "Logs are in: $LOG_DIR"

echo "Leave this shell open to keep background services running, or press Ctrl+C to stop them and exit."
wait
