#!/usr/bin/env python3
"""
Simulate real browser-extension activity for the NEXUS dashboard.

This script posts the same kind of snapshots that the Chrome extension sends to
the browser bridge at http://localhost:9001/ingest. It can also ask the NEXUS
dashboard to import the simulated tabs into a research thread as sources.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


DEFAULT_TABS = [
    {
        "tabId": 501,
        "title": "Retrieval-augmented generation - Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Retrieval-augmented_generation",
    },
    {
        "tabId": 502,
        "title": "Dynamic Retrieval-Augmented Generation",
        "url": "https://core.ac.uk/works/157627067",
    },
    {
        "tabId": 503,
        "title": "A Comprehensive Survey of Hallucination Mitigation Techniques",
        "url": "https://core.ac.uk/works/157283975",
    },
    {
        "tabId": 504,
        "title": "Mitigating Hallucinations via Self-Refinement-Enhanced Knowledge Retrieval",
        "url": "https://core.ac.uk/works/162766677",
    },
    {
        "tabId": 505,
        "title": "arXiv search: retrieval augmented generation evaluation",
        "url": "https://arxiv.org/search/?query=retrieval+augmented+generation+evaluation&searchtype=all",
    },
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


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


def build_snapshot(step: int) -> dict[str, Any]:
    active_index = step % len(DEFAULT_TABS)
    tabs = []
    for index, tab in enumerate(DEFAULT_TABS):
        visits = max(0, step - index + 1)
        progress = min(0.98, max(0.05, visits * 0.17))
        time_on_page = visits * 75
        tabs.append(
            {
                **tab,
                "timeOnPage": time_on_page,
                "readingProgress": round(progress, 2),
                "windowActive": index == active_index,
                "tabIndex": index,
            }
        )

    history = [
        {
            "title": tab["title"],
            "url": tab["url"],
            "visitedAt": now_iso(),
        }
        for tab in tabs[: step + 1]
    ]

    return {
        "tabs": tabs,
        "history": history,
        "timestamp": now_iso(),
    }


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


def main() -> int:
    parser = argparse.ArgumentParser(description="Simulate NEXUS browser-extension tab visits.")
    parser.add_argument("--bridge-url", default="http://localhost:9001")
    parser.add_argument("--dashboard-url", default="http://localhost:8080")
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--interval", type=float, default=1.0)
    parser.add_argument("--thread", help="Thread slug to import tabs into.")
    parser.add_argument(
        "--import-tabs",
        action="store_true",
        help="After simulation, save visible tabs into the selected dashboard thread.",
    )
    args = parser.parse_args()

    print("Simulating browser tab visits...")
    print(f"Browser bridge: {args.bridge_url}")
    print(f"Dashboard: {args.dashboard_url}")

    for step in range(args.steps):
        snapshot = build_snapshot(step)
        active = next(tab for tab in snapshot["tabs"] if tab["windowActive"])
        post_json(f"{args.bridge_url}/ingest", snapshot)
        print(
            f"[{step + 1}/{args.steps}] active={active['title']} "
            f"progress={round(active['readingProgress'] * 100)}% tabs={len(snapshot['tabs'])}"
        )
        if step + 1 < args.steps:
            time.sleep(args.interval)

    try:
        bridge_status = get_json(f"{args.bridge_url}/status")
        tab_count = bridge_status.get("tabCount", 0)
    except HTTPError:
        tabs = get_json(f"{args.bridge_url}/tabs")
        tab_count = len(tabs) if isinstance(tabs, list) else 0
    print(f"Bridge now has {tab_count} tabs.")

    if args.import_tabs:
        slug = choose_thread(args.dashboard_url, args.thread)
        if not slug:
            print("No dashboard thread found to import tabs into.", file=sys.stderr)
            return 2
        try:
            result = post_json(
                f"{args.dashboard_url}/api/threads/{quote(slug)}/import-tabs",
                {},
            )
        except HTTPError as error:
            print(
                "Import failed. Rebuild and restart NEXUS so /api/threads/:slug/import-tabs exists. "
                f"HTTP {error.code}",
                file=sys.stderr,
            )
            return 3
        print(f"Imported {result.get('imported', 0)} tabs into thread: {slug}")

    print("Open the dashboard and refresh: http://localhost:8080")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ConnectionRefusedError, HTTPError, URLError) as error:
        print(f"Could not reach NEXUS service: {error}", file=sys.stderr)
        print("Start the services first: npm run browser:bridge and npm start", file=sys.stderr)
        raise SystemExit(1)
