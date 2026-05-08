#!/usr/bin/env python3
"""
Run the mnemochron judge demo end to end.

The script simulates a user browsing with the Chrome extension, imports the
simulated tabs into the dashboard, and sends a final OpenClaw notification.

Default mode is presentation-safe: OpenClaw is called with --dry-run. Pass
--send after WhatsApp is linked to deliver the message to WHATSAPP_RECIPIENT.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
LOG_DIR = ROOT / "logs"
REPORT_PATH = ROOT / "logs" / "judge-demo-report.json"

TABS = [
    {
        "tabId": 7101,
        "title": "Retrieval-augmented generation - Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
    },
    {
        "tabId": 7102,
        "title": "Dynamic Retrieval-Augmented Generation",
        "url": "https://core.ac.uk/works/157627067",
    },
    {
        "tabId": 7103,
        "title": "A Comprehensive Survey of Hallucination Mitigation Techniques",
        "url": "https://core.ac.uk/works/157283975",
    },
    {
        "tabId": 7104,
        "title": "Mitigating Hallucinations via Self-Refinement-Enhanced Knowledge Retrieval",
        "url": "https://core.ac.uk/works/162766677",
    },
    {
        "tabId": 7105,
        "title": "arXiv search: retrieval augmented generation evaluation",
        "url": "https://arxiv.org/search/?query=retrieval+augmented+generation+evaluation&searchtype=all",
    },
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_env(path: Path) -> dict[str, str]:
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


def env_value(name: str, env_file: dict[str, str], default: str = "") -> str:
    return os.environ.get(name) or env_file.get(name, default)


def request_json(method: str, url: str, payload: dict[str, Any] | None = None, timeout: int = 10) -> Any:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urlopen(request, timeout=timeout) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def get_json(url: str, timeout: int = 10) -> Any:
    return request_json("GET", url, timeout=timeout)


def post_json(url: str, payload: dict[str, Any], timeout: int = 10) -> Any:
    return request_json("POST", url, payload, timeout=timeout)


def is_up(url: str, timeout: int = 8) -> bool:
    try:
        get_json(url, timeout=timeout)
        return True
    except Exception:
        return False


def npm_cmd() -> str:
    return "npm.cmd" if os.name == "nt" else "npm"


def start_service(name: str, command: list[str], health_url: str) -> subprocess.Popen[str] | None:
    if is_up(health_url):
        print(f"[service] {name} already running")
        return None

    LOG_DIR.mkdir(exist_ok=True)
    stdout_path = LOG_DIR / f"judge-demo-{name}.stdout.log"
    stderr_path = LOG_DIR / f"judge-demo-{name}.stderr.log"
    stdout = stdout_path.open("a", encoding="utf-8")
    stderr = stderr_path.open("a", encoding="utf-8")
    print(f"[service] starting {name}: {' '.join(command)}")
    process = subprocess.Popen(
        command,
        cwd=ROOT,
        stdout=stdout,
        stderr=stderr,
        text=True,
        shell=False,
    )

    deadline = time.time() + 35
    while time.time() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"{name} exited early; see {stdout_path} and {stderr_path}")
        if is_up(health_url):
            print(f"[service] {name} is ready")
            return process
        time.sleep(1)

    raise TimeoutError(f"{name} did not become ready; see {stdout_path} and {stderr_path}")


def run_build(skip_build: bool) -> None:
    if skip_build:
        return
    print("[build] compiling TypeScript")
    subprocess.run([npm_cmd(), "run", "build"], cwd=ROOT, check=True)


def ensure_thread(dashboard_url: str, requested_slug: str | None) -> str:
    if requested_slug:
        return requested_slug

    threads = get_json(f"{dashboard_url}/api/threads")
    if isinstance(threads, list):
        existing = next((thread for thread in threads if thread.get("slug") == "judge-demo-rag-research-trail"), None)
        if existing:
            print("[dashboard] using existing judge demo thread")
            return str(existing["slug"])

    print("[dashboard] creating judge demo thread")
    result = post_json(
        f"{dashboard_url}/api/threads",
        {
            "title": "Judge Demo RAG Research Trail",
            "topic_keywords": ["retrieval augmented generation", "hallucination", "evaluation"],
            "priority": "high",
            "watch_sources": ["core", "arxiv"],
        },
    )
    thread = result.get("thread", {})
    slug = thread.get("slug")
    if not slug:
        raise RuntimeError(f"Dashboard did not return a thread slug: {result}")
    return str(slug)


def build_snapshot(step: int) -> dict[str, Any]:
    active_index = step % len(TABS)
    tabs = []
    for index, tab in enumerate(TABS):
        visits = max(0, step - index + 1)
        tabs.append(
            {
                **tab,
                "timeOnPage": visits * 90,
                "readingProgress": round(min(0.98, max(0.08, visits * 0.18)), 2),
                "windowActive": index == active_index,
                "tabIndex": index,
            }
        )
    return {
        "tabs": tabs,
        "history": [
            {
                "title": tab["title"],
                "url": tab["url"],
                "visitedAt": now_iso(),
                "duration": max(30, (step + 1) * 45),
            }
            for tab in tabs[: min(len(tabs), step + 1)]
        ],
        "timestamp": now_iso(),
    }


def simulate_extension(bridge_url: str, steps: int, interval: float) -> None:
    print("[extension] simulating Chrome extension tab snapshots")
    for step in range(steps):
        snapshot = build_snapshot(step)
        active = next(tab for tab in snapshot["tabs"] if tab["windowActive"])
        post_json(f"{bridge_url}/ingest", snapshot)
        print(
            f"[extension] {step + 1}/{steps}: active='{active['title']}' "
            f"progress={round(active['readingProgress'] * 100)}%"
        )
        if step + 1 < steps:
            time.sleep(interval)


def import_tabs(dashboard_url: str, thread_slug: str) -> int:
    result = post_json(f"{dashboard_url}/api/threads/{quote(thread_slug)}/import-tabs", {})
    imported = int(result.get("imported", 0))
    print(f"[dashboard] imported {imported} browser tabs into {thread_slug}")
    return imported


def thread_summary(dashboard_url: str, thread_slug: str) -> dict[str, Any]:
    detail = get_json(f"{dashboard_url}/api/threads/{quote(thread_slug)}")
    thread = detail.get("thread", {})
    sources = detail.get("sources", [])
    print(f"[dashboard] thread='{thread.get('title', thread_slug)}' sources={len(sources)}")
    return {
        "slug": thread_slug,
        "title": thread.get("title", thread_slug),
        "source_count": len(sources),
        "sources": [{"title": item.get("title"), "url": item.get("url")} for item in sources],
    }


def openclaw_command(env_file: dict[str, str]) -> str:
    configured = env_value("OPENCLAW_CLI_PATH", env_file)
    if configured:
        return configured
    return "openclaw.cmd" if os.name == "nt" else "openclaw"


def redact_target(target: str) -> str:
    digits = "".join(ch for ch in target if ch.isdigit())
    if len(digits) > 4:
        return f"***{digits[-4:]}"
    if "@" in target:
        prefix, domain = target.split("@", 1)
        return f"{prefix[:2]}***@{domain}"
    return "***"


def normalize_whatsapp_target(target: str, default_country_code: str = "") -> str:
    cleaned = target.strip()
    digits = "".join(ch for ch in cleaned if ch.isdigit())
    if cleaned.startswith("+"):
        return f"+{digits}"
    country_digits = "".join(ch for ch in default_country_code if ch.isdigit())
    if len(digits) == 10 and country_digits:
        return f"+{country_digits}{digits}"
    if len(digits) > 10:
        return f"+{digits}"
    return cleaned


def compose_message(summary: dict[str, Any], dashboard_url: str) -> str:
    return (
        "mnemochron judge demo complete. "
        f"Thread: {summary['title']}. "
        f"Sources captured from simulated extension: {summary['source_count']}. "
        f"Dashboard: {dashboard_url}"
    )


def send_notification(
    *,
    env_file: dict[str, str],
    target: str,
    message: str,
    send: bool,
) -> dict[str, Any]:
    openclaw = openclaw_command(env_file)
    command = [
        openclaw,
        "message",
        "send",
        "--channel",
        "whatsapp",
        "--target",
        target,
        "--message",
        message,
        "--json",
    ]
    if not send:
        command.append("--dry-run")

    print(f"[notify] whatsapp target={redact_target(target)} mode={'send' if send else 'dry-run'}")
    completed = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    stdout = redact_openclaw_output(completed.stdout.strip())
    stderr = redact_openclaw_output(completed.stderr.strip())
    if completed.stdout.strip():
        print(stdout)
    if completed.stderr.strip():
        print(stderr, file=sys.stderr)
    print(f"[notify] exit={completed.returncode}")
    return {
        "mode": "send" if send else "dry-run",
        "target": redact_target(target),
        "exit_code": completed.returncode,
        "stdout": stdout,
        "stderr": stderr,
    }


def redact_openclaw_output(raw: str) -> str:
    if not raw:
        return raw
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return raw

    message_payload = payload.get("payload")
    if isinstance(message_payload, dict):
        for key in ("to", "target", "recipient"):
            value = message_payload.get(key)
            if isinstance(value, str) and value:
                message_payload[key] = redact_target(value)

    return json.dumps(payload, indent=2)


def write_report(report: dict[str, Any]) -> None:
    LOG_DIR.mkdir(exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"[report] wrote {REPORT_PATH}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the mnemochron judge demo.")
    parser.add_argument("--dashboard-url", default="http://localhost:8080")
    parser.add_argument("--bridge-url", default="http://localhost:9001")
    parser.add_argument("--thread", help="Use an existing thread slug instead of creating the judge demo thread.")
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--interval", type=float, default=0.6)
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--no-start", action="store_true", help="Require services to already be running.")
    parser.add_argument("--keep-services", action="store_true", help="Leave any services started by this script running.")
    parser.add_argument("--send", action="store_true", help="Actually send the WhatsApp message.")
    parser.add_argument("--target", help="Override WHATSAPP_RECIPIENT.")
    args = parser.parse_args()

    env_file = load_env(ENV_PATH)
    target = normalize_whatsapp_target(
        args.target or env_value("WHATSAPP_RECIPIENT", env_file),
        env_value("WHATSAPP_DEFAULT_COUNTRY_CODE", env_file),
    )
    if not target:
        print("Set WHATSAPP_RECIPIENT in .env or pass --target.", file=sys.stderr)
        return 2

    started: list[subprocess.Popen[str]] = []
    try:
        run_build(args.skip_build)
        if args.no_start:
            if not is_up(f"{args.bridge_url}/status") or not is_up(f"{args.dashboard_url}/api/status"):
                raise RuntimeError("Services are not running. Remove --no-start or start them first.")
        else:
            started_process = start_service(
                "browser-bridge",
                [npm_cmd(), "run", "browser:bridge"],
                f"{args.bridge_url}/status",
            )
            if started_process:
                started.append(started_process)
            started_process = start_service(
                "mnemochron-dashboard",
                [npm_cmd(), "start"],
                f"{args.dashboard_url}/api/status",
            )
            if started_process:
                started.append(started_process)

        slug = ensure_thread(args.dashboard_url, args.thread)
        simulate_extension(args.bridge_url, args.steps, args.interval)
        imported = import_tabs(args.dashboard_url, slug)
        summary = thread_summary(args.dashboard_url, slug)
        message = compose_message(summary, args.dashboard_url)
        notification = send_notification(
            env_file=env_file,
            target=target,
            message=message,
            send=args.send,
        )

        report = {
            "ok": notification["exit_code"] == 0,
            "timestamp": now_iso(),
            "dashboard_url": args.dashboard_url,
            "bridge_url": args.bridge_url,
            "thread": summary,
            "imported_this_run": imported,
            "message": message,
            "notification": notification,
        }
        write_report(report)
        print("[done] judge demo complete")
        return 0 if notification["exit_code"] == 0 else 1
    finally:
        if args.keep_services and started:
            print("[service] leaving demo services running")
        else:
            for process in started:
                process.terminate()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ConnectionRefusedError, HTTPError, URLError, TimeoutError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f"[error] {error}", file=sys.stderr)
        raise SystemExit(1)
