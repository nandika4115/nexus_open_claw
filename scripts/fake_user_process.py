#!/usr/bin/env python3
"""
Fake a complete mnemochron user process and optionally notify via OpenClaw channels.

Default behavior is safe:
- Simulates browser visits through the browser bridge.
- Attempts to import those tabs into the selected dashboard thread.
- Runs OpenClaw WhatsApp/iMessage sends in dry-run mode.

Pass --send to actually deliver messages through OpenClaw.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def env_value(name: str, env_file: dict[str, str]) -> str:
    return os.environ.get(name) or env_file.get(name, "")


def request_json(method: str, url: str, payload: dict[str, Any] | None = None) -> Any:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urlopen(request, timeout=10) as response:
        data = response.read().decode("utf-8")
        return json.loads(data) if data else {}


def get_json(url: str) -> Any:
    return request_json("GET", url)


def post_json(url: str, payload: dict[str, Any]) -> Any:
    return request_json("POST", url, payload)


def choose_thread(dashboard_url: str, requested_slug: str | None) -> str | None:
    if requested_slug:
        return requested_slug
    try:
        threads = get_json(f"{dashboard_url}/api/threads")
    except Exception:
        return None
    if not isinstance(threads, list) or not threads:
        return None
    demo = next((thread for thread in threads if "demo" in str(thread.get("slug", ""))), None)
    selected = demo or threads[0]
    slug = selected.get("slug")
    return str(slug) if slug else None


def simulate_browser(steps: int, interval: float, import_tabs: bool) -> None:
    command = [
        sys.executable,
        str(ROOT / "scripts" / "demo_browser_activity.py"),
        "--steps",
        str(steps),
        "--interval",
        str(interval),
    ]
    if import_tabs:
        command.append("--import-tabs")
    subprocess.run(command, cwd=ROOT, check=True)


def openclaw_command(env_file: dict[str, str]) -> str:
    configured = env_value("OPENCLAW_CLI_PATH", env_file)
    if configured:
        return configured
    return "openclaw.cmd" if os.name == "nt" else "openclaw"


def redacted_target(target: str) -> str:
    if "@" in target:
        name, domain = target.split("@", 1)
        return f"{name[:2]}***@{domain}"
    digits = "".join(character for character in target if character.isdigit())
    if len(digits) <= 4:
        return "***"
    return f"***{digits[-4:]}"


def redacted_openclaw_output(raw_output: str) -> str:
    try:
        payload = json.loads(raw_output)
    except json.JSONDecodeError:
        return raw_output

    message_payload = payload.get("payload")
    if isinstance(message_payload, dict):
        for key in ("to", "target", "recipient"):
            value = message_payload.get(key)
            if isinstance(value, str) and value:
                message_payload[key] = redacted_target(value)

    return json.dumps(payload, indent=2)


def send_openclaw_message(
    *,
    openclaw: str,
    channel: str,
    target: str,
    message: str,
    send: bool,
) -> int:
    command = [
        openclaw,
        "message",
        "send",
        "--channel",
        channel,
        "--target",
        target,
        "--message",
        message,
        "--json",
    ]
    if not send:
        command.append("--dry-run")

    completed = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    print(f"[{channel}] exit={completed.returncode} mode={'send' if send else 'dry-run'}")
    if completed.stdout.strip():
        print(redacted_openclaw_output(completed.stdout.strip()))
    if completed.stderr.strip():
        print(completed.stderr.strip(), file=sys.stderr)
    if not send and "Channel is unavailable" in completed.stderr:
        print(f"[{channel}] dry-run warning: configure this OpenClaw channel before real sends")
        return 0
    return completed.returncode


def compose_message(dashboard_url: str, thread_slug: str | None) -> str:
    if not thread_slug:
        return f"mnemochron demo process complete. Dashboard: {dashboard_url}"
    try:
        detail = get_json(f"{dashboard_url}/api/threads/{quote(thread_slug)}")
        title = detail.get("thread", {}).get("title", thread_slug)
        sources = len(detail.get("sources", []))
        return f"mnemochron demo process complete. Thread: {title}. Sources: {sources}. Dashboard: {dashboard_url}"
    except Exception:
        return f"mnemochron demo process complete. Thread: {thread_slug}. Dashboard: {dashboard_url}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Fake a user process and notify through OpenClaw.")
    parser.add_argument("--dashboard-url", default="http://localhost:8080")
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--interval", type=float, default=1.0)
    parser.add_argument("--thread", help="Dashboard thread slug to import tabs into.")
    parser.add_argument("--skip-browser", action="store_true")
    parser.add_argument("--no-import-tabs", action="store_true")
    parser.add_argument("--send", action="store_true", help="Actually send WhatsApp/iMessage messages.")
    parser.add_argument("--whatsapp-target", help="Override WHATSAPP_RECIPIENT.")
    parser.add_argument("--imessage-target", help="Override IMESSAGE_RECIPIENT.")
    parser.add_argument("--message", help="Override notification text.")
    args = parser.parse_args()

    env_file = load_env_file(ENV_PATH)

    if not args.skip_browser:
        simulate_browser(
            steps=args.steps,
            interval=args.interval,
            import_tabs=not args.no_import_tabs,
        )

    thread_slug = choose_thread(args.dashboard_url, args.thread)
    message = args.message or compose_message(args.dashboard_url, thread_slug)
    openclaw = openclaw_command(env_file)

    whatsapp_target = args.whatsapp_target or env_value("WHATSAPP_RECIPIENT", env_file)
    imessage_target = args.imessage_target or env_value("IMESSAGE_RECIPIENT", env_file)

    print("OpenClaw notification orchestration")
    print(f"Mode: {'send' if args.send else 'dry-run'}")
    print(f"Recipients: whatsapp={redacted_target(whatsapp_target) if whatsapp_target else 'missing'}; imessage={redacted_target(imessage_target) if imessage_target else 'missing'}")
    print(f"Message: {message}")

    exit_code = 0
    if whatsapp_target:
        exit_code |= send_openclaw_message(
            openclaw=openclaw,
            channel="whatsapp",
            target=whatsapp_target,
            message=message,
            send=args.send,
        )
    else:
        print("[whatsapp] skipped: set WHATSAPP_RECIPIENT in .env")

    if imessage_target:
        exit_code |= send_openclaw_message(
            openclaw=openclaw,
            channel="imessage",
            target=imessage_target,
            message=message,
            send=args.send,
        )
    else:
        print("[imessage] skipped: set IMESSAGE_RECIPIENT in .env")

    print("Done.")
    return 0 if exit_code == 0 else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        print(f"Process failed: {error}", file=sys.stderr)
        raise SystemExit(error.returncode)
    except (ConnectionRefusedError, HTTPError, URLError) as error:
        print(f"Could not reach a local mnemochron/OpenClaw service: {error}", file=sys.stderr)
        print("Start services first: npm run browser:bridge, npm start, and npm run openclaw:gateway", file=sys.stderr)
        raise SystemExit(1)
