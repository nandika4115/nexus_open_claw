# NEXUS — Neural EXperience & Understanding Synthesizer

> **"Your research never forgets. Neither should you."**

NEXUS is a persistent, proactive research cognition layer built on the **OpenClaw autonomous AI agent framework**. It lives alongside a researcher's workflow — silently capturing, connecting, and resurfacing intellectual context across time, tools, and sessions. It does not wait to be asked; it thinks _with_ the user.

This README is the single source of truth for any CLI agent, developer, or automated system tasked with building, extending, or deploying NEXUS. Every design decision, data contract, file structure, API dependency, agent behavior, and build instruction is documented here.

---

## Table of Contents

1. [Hackathon Context](#1-hackathon-context)
2. [OpenClaw Framework — Full Reference](#2-openclaw-framework--full-reference)
3. [Problem Statement](#3-problem-statement)
4. [Project Overview — NEXUS](#4-project-overview--nexus)
5. [Architecture — High-Level](#5-architecture--high-level)
6. [Memory Layer — Full Specification](#6-memory-layer--full-specification)
7. [Heartbeat System — Full Specification](#7-heartbeat-system--full-specification)
8. [Tool Execution Layer](#8-tool-execution-layer)
9. [Channel / Output Layer](#9-channel--output-layer)
10. [Autonomous Behaviors — Detailed Logic](#10-autonomous-behaviors--detailed-logic)
11. [Agent Reasoning Loop](#11-agent-reasoning-loop)
12. [File & Directory Structure](#12-file--directory-structure)
13. [API Integrations & External Dependencies](#13-api-integrations--external-dependencies)
14. [Environment Variables & Configuration](#14-environment-variables--configuration)
15. [Setup & Installation](#15-setup--installation)
16. [MVP Scope — Hackathon Build Plan](#16-mvp-scope--hackathon-build-plan)
17. [Evaluation Criteria Alignment](#17-evaluation-criteria-alignment)
18. [Future Scale Vision](#18-future-scale-vision)
19. [User Stories & Journeys](#19-user-stories--journeys)
20. [KPIs & Benchmarks](#20-kpis--benchmarks)
21. [AI Disclosure](#21-ai-disclosure)
22. [Glossary](#22-glossary)

---

## 1. Hackathon Context

| Field          | Detail                                               |
| -------------- | ---------------------------------------------------- |
| Hackathon Name | **CLASH OF THE CLAWS — The OpenClaw Hackathon**      |
| Organized by   | Tech Management, SRI-B (Samsung R&D Institute)       |
| Duration       | 20th April – 20th May 2026                           |
| Prize Pool     | ₹80,000                                              |
| Theme Selected | **Theme 3: Productivity Platforms**                  |
| Framework      | OpenClaw (formerly Clawdbot → Moltbot)               |
| GitHub Stars   | 247K+ as of March 2026                               |
| Governance     | OpenClaw Foundation (post-founder Peter Steinberger) |

### Hackathon Timeline

| Milestone                 | Date          | Deliverable                                        |
| ------------------------- | ------------- | -------------------------------------------------- |
| Team & Ideas Registration | 24 April 2026 | Idea submission, theme finalization                |
| First-round Submission    | 8 May 2026    | Working code, video demo, GitHub repo, README, PPT |
| Second-round Announcement | 15 May 2026   | Top teams selected                                 |
| Final Demo                | 19 May 2026   | Hands-on demo video (10 min, 1–3 scenarios)        |
| Final Result              | 24 May 2026   | Winners announced per theme                        |

### Final Evaluation Weightings

| Criterion                                | Weight |
| ---------------------------------------- | ------ |
| Working Prototype / Functionality        | 35%    |
| Technical Depth of Contribution          | 25%    |
| User Experience (UI/UX, novelty)         | 15%    |
| Relevance to Theme & Business Importance | 15%    |
| Presentation & Documentation             | 10%    |

---

## 2. OpenClaw Framework — Full Reference

OpenClaw is an **autonomous AI agent framework** designed to run on user-owned hardware (Mac mini, VPS, homelab). It gives users full AI sovereignty — the agent runs locally, stores memory locally, and is not dependent on any single cloud vendor.

### 2.1 The Core Metaphor — "The Tank"

| Component | Metaphor     | Technical Equivalent                                          |
| --------- | ------------ | ------------------------------------------------------------- |
| The Tank  | Environment  | User's hardware: Mac mini, VPS, x86 PC                        |
| The Food  | Intelligence | LLM API keys: Claude (Anthropic), GPT-4, local Llama/DeepSeek |
| The Rules | Personality  | `SOUL.md` — plain-text behavioral & personality file          |

### 2.2 Core OpenClaw Features

- **Persistent Memory:** Markdown and YAML files stored locally. Fully inspectable, diff-able, version-controllable. Survives restarts and resets.
- **HEARTBEAT System:** A background daemon that reads `HEARTBEAT.md` and acts proactively without user prompts — sending reminders, digests, alerts.
- **Multi-Channel Communication:** WhatsApp, Telegram, Discord, iMessage, Slack, Signal, Microsoft Teams, Matrix, Twitch, Google Chat.
- **Tool / Skill Execution:** Shell commands, API calls, file system access, automation scripts — executed in isolated sandboxes.
- **Media & Document Support:** Processes and sends images, audio, files. Supports Live Canvas (A2UI) for interactive dashboards.
- **Durable Memory (Cognitive RAM):** Pages relevant context from disk into the LLM context window as needed. Handles projects larger than single-session limits.
- **No Vendor Lock-in:** Swap LLM backends without losing any memory or agent state.

### 2.3 The 5-Layer OpenClaw Stack

```
Layer 1 — Communication Layer
        WhatsApp · Discord · Slack · Telegram · iMessage · Signal · Teams · Matrix
        ↓
Layer 2 — Channel Adapter
        ProtocolAdapter: normalizes all platforms into a unified agent interface
        ↓
Layer 3 — Gateway (Control Plane)
        TypeScript/Node.js WebSocket server
        Handles: routing, authentication, session management
        ↓
Layer 4 — Pi Engine (Agent Loop)
        Reasoning core embedded as dynamic library
        High-speed, event-driven execution
        Runs the plan → act → observe → update memory loop
        ↓
Layer 5 — Skill Execution Layer
        Invokes tools, runs shell commands
        Manages system actions in isolated sandboxes
```

### 2.4 OpenClaw Hardware Requirements

| Spec             | Minimum           | Recommended                       |
| ---------------- | ----------------- | --------------------------------- |
| CPU              | 2-core x86 or ARM | Apple M-series or 8-core x86      |
| RAM              | 4 GB              | 16 GB (for multi-agent setups)    |
| OS               | macOS, Linux      | macOS (M-series) or Ubuntu 22.04+ |
| Always-on option | VPS               | Mac mini or homelab server        |

### 2.5 OpenClaw Software Stack

| Component        | Requirement                       |
| ---------------- | --------------------------------- |
| Node.js          | ≥ 22 (mandatory)                  |
| Language         | TypeScript                        |
| Containerization | Docker Compose (safest isolation) |
| Local LLM (opt.) | Ollama (DeepSeek, Llama)          |

### 2.6 OpenClaw Install

```bash
# One-liner (Mac/Linux)
curl -fsSL https://openclaw.ai/install.sh | bash

# Onboarding wizard
openclaw onboard --install-daemon

# Channel setup (guided)
# WhatsApp: QR scan
# Telegram: BotFather token
# Discord: OAuth2 portal
```

### 2.7 SOUL.md — Agent Personality File

`SOUL.md` is a plain-text file that defines the agent's personality, behavioral rules, and operating constraints. For NEXUS, this file should encode:

- Agent name and purpose
- Tone (helpful, non-intrusive, research-aware)
- Privacy rules (never exfiltrate data, local-only by default)
- Escalation rules (when to notify vs. stay silent)
- LLM provider preference and fallback chain

### 2.8 HEARTBEAT.md — Proactive Behavior File

`HEARTBEAT.md` defines what the agent does on a time-based schedule without user input. It is read by the background daemon at each tick. For NEXUS, this file encodes all five autonomous behavior triggers (see Section 10).

### 2.9 OpenClaw Variants Ecosystem

NEXUS is built on core OpenClaw. The following variant ecosystem exists for reference:

| Variant  | Provider    | Use Case              |
| -------- | ----------- | --------------------- |
| MiClaw   | Xiaomi      | Mobile-specific       |
| QClaw    | Tencent     | Cloud-specific        |
| TuyaClaw | Tuya Smart  | IoT / edge            |
| KimiClaw | Moonshot AI | Cloud LLM integration |
| ArkClaw  | ByteDance   | Cloud-specific        |
| EdgeClaw | OpenBMB     | Edge + cloud          |
| AutoClaw | ZhipuAI     | Cloud automation      |
| CoPaw    | Alibaba     | Enterprise cloud      |
| IronClaw | Near AI     | Open source cloud     |

---

## 3. Problem Statement

**Theme:** Productivity Platforms — "What tools can you create to make your life at work easier and to make AI your best colleague?"

### 3.1 Core Problem

Researchers, analysts, engineers, and knowledge workers constantly lose context across work sessions. The specific failure modes are:

- **Tab Explosion:** The average knowledge worker has 47+ browser tabs open at any time. Tabs are being used as a proxy for working memory because no native memory system exists.
- **Session Loss:** Close a laptop at night, return in the morning — the thread of thought is gone. Context reconstruction burns 15–30 minutes every morning.
- **Scattered Notes:** Research notes live across Notion, Obsidian, Google Docs, local `.txt` files, Slack threads, and email. There is no unified surface.
- **Lost Connections:** A paper read on Tuesday cites the same framework as a paper read the previous Thursday. Without a connection engine, this link is never surfaced.
- **Re-exploration Waste:** The same research rabbit hole gets explored twice because there is no record of prior traversal.
- **Literature Gaps:** Relevant new papers get published while a researcher is heads-down. Without a watch system, these are missed for days or weeks.

**Quantified Impact:**

- ~2–4 hours per week per knowledge worker lost to context reconstruction.
- At a 10-person research team: 20–40 hours/week = 1 full-time equivalent of pure waste.
- Estimated industry-wide: millions of person-hours annually.

### 3.2 Why Existing Tools Fail

| Tool            | Gap                                                          |
| --------------- | ------------------------------------------------------------ |
| Notion          | Passive — only stores what you manually write                |
| Obsidian        | Passive — requires discipline to maintain; no proactive push |
| Browser history | Unstructured, no semantic understanding                      |
| Readwise        | Highlights only, no cross-session connection engine          |
| Google Keep     | No autonomy, no memory, no heartbeat                         |
| Roam Research   | Requires manual graph construction                           |

NEXUS solves what none of them do: **autonomous, proactive, cross-surface context continuity** powered by an always-on AI agent.

---

## 4. Project Overview — NEXUS

| Field           | Value                                                             |
| --------------- | ----------------------------------------------------------------- |
| Project Name    | **NEXUS**                                                         |
| Full Name       | Neural EXperience & Understanding Synthesizer                     |
| Tagline         | "Your research never forgets. Neither should you."                |
| Framework       | OpenClaw (core)                                                   |
| Theme           | Productivity Platforms (Theme 3)                                  |
| Target User     | Researchers, analysts, engineers, writers, knowledge workers      |
| Primary Value   | Eliminate the "where was I?" problem across all research sessions |
| Autonomy Level  | Fully autonomous — all 5 core behaviors require zero user input   |
| LLM Backend     | Anthropic Claude (primary), Gemini (fallback)                     |
| Memory Format   | Hierarchical Markdown + YAML                                      |
| Primary Channel | Desktop notifications + Slack DM + iMessage                       |

---

## 5. Architecture — High-Level

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER                             │
│  Browser Ext API  │  File Watcher  │  Notion/Obsidian  │  arXiv │
└────────┬──────────┴───────┬────────┴──────────┬─────────┴───┬───┘
         │                  │                   │             │
         └──────────────────┴───────────────────┴─────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │      OPENCLAW GATEWAY           │
                    │  TypeScript/Node.js WebSocket   │
                    │  Routing · Auth · Sessions      │
                    └───────────────┬────────────────┘
                                    │
              ┌─────────────────────▼──────────────────────┐
              │              PI ENGINE (AGENT LOOP)         │
              │                                             │
              │  HEARTBEAT (30-min tick)                    │
              │         ↓                                   │
              │  plan → act → observe → update memory       │
              │         ↑________________________↓          │
              │              MEMORY ENGINE                  │
              │    Thread files · Index · Connection graph  │
              └──────────────────┬─────────────────────────┘
                                 │
         ┌───────────────────────▼───────────────────────────┐
         │               AUTONOMOUS BEHAVIORS                 │
         │  Session Snapshot │ Thread Resurrection            │
         │  Connection Engine │ Morning Briefing │ Lit. Watch │
         └───────────────────┬───────────────────────────────┘
                             │
         ┌───────────────────▼───────────────────────────────┐
         │                 OUTPUT CHANNELS                    │
         │  Desktop Notif. │ Slack DM │ iMessage │ Digest     │
         └───────────────────────────────────────────────────┘
                             │
                      ┌──────▼──────┐
                      │    USER     │
                      │  (works     │
                      │  normally)  │
                      └──────┬──────┘
                             │  passive capture (loop back)
                             └───────────────────────────────┐
                                                             │
                                                    INPUT LAYER ←┘
```

### 5.1 Component Responsibilities

| Component            | Responsibility                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| Browser Extension    | Reads open tab URLs, page titles, reading progress, time-on-page           |
| File Watcher         | Monitors local directories for note creation/modification events           |
| Notion/Obsidian API  | Pulls recently modified pages; pushes session summaries and digests        |
| arXiv / Sem. Scholar | Queries for new papers matching tracked research topic keywords            |
| OpenClaw Gateway     | WebSocket server; routes signals from input layer to Pi Engine             |
| Pi Engine            | Core agent loop; runs LLM reasoning; dispatches to behavior modules        |
| HEARTBEAT Daemon     | 30-min background tick; reads HEARTBEAT.md; triggers behavior modules      |
| Memory Engine        | Reads/writes thread files; maintains index; computes connection graph      |
| Behavior Modules     | Five pluggable modules (see Section 10) — each has its own trigger + logic |
| Output Channels      | Deliver formatted context, alerts, and digests to the user                 |

---

## 6. Memory Layer — Full Specification

The memory layer is the most critical component of NEXUS. It is OpenClaw's persistent markdown/YAML storage, extended with a hierarchical structure designed specifically for research context.

### 6.1 Root Directory Layout

```
~/.nexus/memory/
├── _index.yaml                    # Master thread registry
├── _connections.yaml              # Cross-thread connection graph
├── _config.yaml                   # User preferences and settings
├── SOUL.md                        # Agent personality (OpenClaw)
├── HEARTBEAT.md                   # Proactive behavior schedule (OpenClaw)
├── threads/
│   ├── {thread-slug}/
│   │   ├── thread.md              # Main thread file
│   │   ├── sources.yaml           # All source URLs + metadata
│   │   ├── insights.md            # Extracted key insights
│   │   ├── questions.md           # Open questions / gaps
│   │   └── sessions/
│   │       ├── {YYYY-MM-DD-HH}.md # Per-session snapshots
│   │       └── ...
│   └── ...
├── digests/
│   ├── daily/
│   │   └── {YYYY-MM-DD}.md
│   └── weekly/
│       └── {YYYY-WNN}.md
└── briefings/
    └── {YYYY-MM-DD}-morning.md
```

### 6.2 `_index.yaml` — Master Thread Registry

```yaml
# _index.yaml
schema_version: "1.0"
last_updated: "2026-05-06T08:30:00Z"

threads:
  - id: "llm-alignment-survey"
    slug: "llm-alignment-survey"
    title: "LLM Alignment Survey"
    status: active # active | dormant | archived
    priority: high # high | medium | low
    created_at: "2026-04-20T10:00:00Z"
    last_touched: "2026-05-05T22:15:00Z"
    last_snapshot: "2026-05-05T22:00:00Z"
    topic_keywords:
      - "RLHF"
      - "constitutional AI"
      - "reward modeling"
      - "AI alignment"
    source_count: 14
    insight_count: 31
    connection_count: 3
    dormancy_threshold_hours: 72 # after this, thread is "dormant"
    watch_sources:
      - arxiv
      - semantic_scholar
```

### 6.3 `threads/{slug}/thread.md` — Main Thread File

```markdown
# Thread: LLM Alignment Survey

**Status:** active
**Created:** 2026-04-20
**Last Touched:** 2026-05-05
**Priority:** high

## Summary

One-paragraph summary of the research thread's current state,
auto-generated by NEXUS on each snapshot. Overwritten by agent.

## Current Focus

What the researcher was actively working on in the most recent session.
Auto-populated from the last session snapshot.

## Key Sources

- [Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) — Anthropic, 2022
- [Reward Modeling for Mitigating Sycophancy](https://arxiv.org/abs/2309.xxxxx)

## Open Questions

- [ ] How does RLAIF differ from RLHF at scale?
- [ ] What is the compute cost differential for Constitutional AI vs. RLHF?

## Connections

- → thread: `reward-modeling-basics` (shared concept: Bradly-Terry model)
- → thread: `ai-safety-mechanistic-interp` (cited by: Anthropic 2024 paper)
```

### 6.4 `threads/{slug}/sources.yaml` — Source Registry

```yaml
sources:
  - id: "src_001"
    url: "https://arxiv.org/abs/2212.08073"
    title: "Constitutional AI: Harmlessness from AI Feedback"
    authors: ["Bai et al."]
    published: "2022-12-15"
    added_at: "2026-04-21T14:30:00Z"
    last_read: "2026-04-21T15:45:00Z"
    reading_progress: 0.85 # 0.0 to 1.0 (from browser extension)
    tags: ["constitutional-ai", "RLHF", "harmlessness"]
    key_excerpt: "We show that Constitutional AI can produce models that are both helpful and harmless..."
    citation_overlap: # other threads whose sources cite this
      - "ai-safety-mechanistic-interp"
```

### 6.5 `threads/{slug}/sessions/{timestamp}.md` — Session Snapshot

```markdown
# Session Snapshot — 2026-05-05 22:00

**Duration:** ~2h 15min (estimated from activity window)
**Active Thread:** llm-alignment-survey

## Open Tabs at Snapshot

- [Constitutional AI paper](https://arxiv.org/abs/2212.08073) — 85% read
- [Reward Modeling for Sycophancy](https://arxiv.org/abs/2309.xxxxx) — 40% read
- [Anthropic Model Card 2024](https://www.anthropic.com/model-card) — 100% read

## Recently Copied to Clipboard

> "The core idea is that instead of using human feedback to train the reward model,
> we use AI feedback from a larger model."

## Files Modified This Session

- ~/research/alignment-notes.md (Obsidian)
- ~/Desktop/paper-notes.txt

## Agent Observations

- High focus on reward model architecture — 3 papers, 45+ minutes
- New concept introduced: "sycophancy mitigation" — flagged as open question
- Reading velocity: moderate (suggests deep engagement, not skimming)

## Suggested Next Session Start

Resume from: reward modeling paper at 40%. Open question: RLAIF cost differential.
```

### 6.6 `_connections.yaml` — Cross-Thread Connection Graph

```yaml
# _connections.yaml
connections:
  - id: "conn_001"
    from_thread: "llm-alignment-survey"
    to_thread: "reward-modeling-basics"
    strength: 0.87 # 0.0–1.0 semantic similarity score
    basis: "citation_overlap" # citation_overlap | keyword_match | manual
    shared_concepts:
      - "Bradley-Terry preference model"
      - "reward model training"
    discovered_at: "2026-05-05T23:00:00Z"
    surfaced_to_user: false # becomes true after agent notifies user
```

---

## 7. Heartbeat System — Full Specification

The HEARTBEAT system is OpenClaw's core proactive mechanism. NEXUS configures it to run a 30-minute snapshot cycle plus several scheduled daily behaviors.

### 7.1 `HEARTBEAT.md` — NEXUS Configuration

```markdown
# NEXUS HEARTBEAT Configuration

## Tick Interval

every: 30 minutes

## Behaviors

### snapshot

trigger: tick
action: run_session_snapshot
description: >
Poll browser extension for open tabs, check file watcher for
modified notes, check clipboard for new excerpts. Write session
entry to active thread's sessions/ directory. Update thread.md
summary and last_touched timestamp in \_index.yaml.

### thread_resurrection

trigger: tick
condition: dormant_thread_activity_detected
action: resurface_thread_context
description: >
If a tab URL or modified file maps to a dormant thread
(last_touched > dormancy_threshold_hours ago), immediately
compose and deliver a context brief within 60 seconds.
Include top 3 prior insights, last session summary, open questions.

### connection_engine

trigger: daily at 23:00
action: run_semantic_similarity_pass
description: >
Compute pairwise semantic similarity across all thread insight files.
For any pair scoring > 0.75 and not already in \_connections.yaml,
create a new connection entry. Queue for user notification.

### morning_briefing

trigger: daily at configured_briefing_time (default 08:30)
action: generate_morning_briefing
description: >
Compose a morning brief covering all active threads:

- What was being worked on (last session summary)
- Where it stopped (last checkpoint)
- New publications matched overnight (from lit_watch)
- Any new connections discovered
  Deliver via configured morning channel (iMessage or Slack).

### lit_watch

trigger: daily at 06:00
action: scan_publication_feeds
description: >
For each thread with watch_sources enabled, query arXiv API
and Semantic Scholar API using topic_keywords. Compare results
against known sources in sources.yaml. Flag new papers with
relevance score. Append to thread's sources.yaml with
status: "new_unread". Queue for morning briefing.
```

### 7.2 Heartbeat State Machine

```
TICK (every 30 min)
  │
  ├─ Poll browser extension API
  │    ├─ GET /tabs → [{url, title, timeOnPage, readingProgress}]
  │    └─ Map URLs → thread slugs via _index.yaml
  │
  ├─ Poll file watcher events
  │    └─ [{path, modified_at, diff_summary}]
  │
  ├─ Poll clipboard history API
  │    └─ [{content, timestamp}]
  │
  ├─ For each active thread with new signals:
  │    └─ Write session snapshot → threads/{slug}/sessions/{ts}.md
  │
  ├─ For each dormant thread with new signals:
  │    └─ TRIGGER thread_resurrection immediately
  │
  └─ Update _index.yaml → last_snapshot timestamps
```

---

## 8. Tool Execution Layer

These are the OpenClaw "Skills" (tools) that NEXUS registers and invokes.

### 8.1 Tool: Browser Extension API Bridge

**Purpose:** Read active browser state — open tabs, reading progress, time-on-page.

**Implementation:**

- A lightweight browser extension (Chrome/Firefox) exposes a local REST API on `http://localhost:9001`.
- The extension tracks: tab URL, page title, scroll depth (as reading progress %), time spent on tab.
- NEXUS polls this endpoint every 30 minutes via the heartbeat.

**API Contract:**

```
GET http://localhost:9001/tabs
Response:
[
  {
    "url": "https://arxiv.org/abs/2212.08073",
    "title": "Constitutional AI...",
    "timeOnPage": 2700,         // seconds
    "readingProgress": 0.85,    // 0.0–1.0 scroll depth proxy
    "windowActive": true,
    "tabIndex": 3
  }
]

GET http://localhost:9001/history?since={iso_timestamp}
Response: [{url, title, visitedAt, duration}]
```

### 8.2 Tool: File System Watcher

**Purpose:** Detect when the user creates or modifies local note files.

**Implementation:**

- Uses Node.js `chokidar` for cross-platform file watching.
- Monitored paths configured in `_config.yaml` (default: `~/Documents`, `~/research`, `~/Desktop`).
- On file change: reads diff, extracts new text, maps to thread by keyword matching.

**Config:**

```yaml
# _config.yaml → file_watcher section
file_watcher:
  enabled: true
  watch_paths:
    - "~/Documents"
    - "~/research"
    - "~/Desktop"
  extensions: [".md", ".txt", ".docx", ".pdf"]
  ignore_patterns:
    - "node_modules/**"
    - ".git/**"
    - "*.DS_Store"
  debounce_ms: 2000
```

### 8.3 Tool: Notion API Bridge

**Purpose:** Pull recently modified Notion pages; push session summaries and digests.

**API Used:** Notion REST API v1
**Auth:** OAuth2 integration token or Internal Integration Token

**Operations:**

```
GET /v1/search → query for pages modified in last 30 min
GET /v1/blocks/{page_id}/children → read page content
POST /v1/pages → create new digest or briefing page
PATCH /v1/blocks/{block_id} → append session summary to existing page
```

### 8.4 Tool: Obsidian API Bridge

**Purpose:** Read and write Obsidian vault notes.

**Implementation:**

- Uses the **Obsidian Local REST API** community plugin (`https://github.com/coddingtonbear/obsidian-local-rest-api`).
- Exposes a local HTTPS API for vault read/write.

**Operations:**

```
GET  /vault/{path}             → read note content
POST /vault/{path}             → create note
PUT  /vault/{path}             → overwrite note
GET  /vault/                   → list all notes
GET  /search/simple?q={query}  → search vault
```

### 8.5 Tool: arXiv API Client

**Purpose:** Query for new preprints matching tracked research topic keywords.

**API:** arXiv.org Atom API (no auth required)

**Query format:**

```
GET http://export.arxiv.org/api/query?
  search_query=ti:{keyword}+OR+abs:{keyword}
  &sortBy=submittedDate
  &sortOrder=descending
  &start=0
  &max_results=10
```

**Response parsing:** Atom XML → extract title, authors, abstract, arxiv_id, submitted date.

### 8.6 Tool: Semantic Scholar API Client

**Purpose:** Find related papers, compute citation overlap between threads.

**API:** Semantic Scholar Academic Graph API
**Base URL:** `https://api.semanticscholar.org/graph/v1`
**Auth:** Optional API key for higher rate limits

**Operations:**

```
GET /paper/search?query={keywords}&fields=title,authors,year,citationCount,abstract
GET /paper/{paper_id}?fields=references,citations
GET /paper/{paper_id}/citations
```

### 8.7 Tool: Clipboard Monitor

**Purpose:** Passively capture text excerpts the user copies during research.

**Implementation:**

- Node.js `clipboardy` or platform-native clipboard API polling every 10 seconds.
- Filters: only captures if copied text is >50 characters (avoids URLs, small snippets).
- Deduplicates within a 5-minute window.
- Appends captured excerpts to the active thread's current session snapshot.

### 8.8 Tool: LLM Summarization (Claude API)

**Purpose:** Auto-generate thread summaries, insight extraction, connection descriptions, briefing text.

**Model:** `claude-sonnet-4-20250514` (primary) / `gpt-4o` (fallback)

**Usage contexts:**

- Summarizing a new source's abstract into a 2-sentence insight
- Generating the morning briefing narrative
- Describing a newly discovered cross-thread connection
- Extracting open questions from session notes

**Prompt templates are stored in:** `~/.nexus/prompts/` as `.md` files, allowing user customization.

---

## 9. Channel / Output Layer

### 9.1 Channels Used by NEXUS

| Channel              | Use Case                                     | Trigger                       |
| -------------------- | -------------------------------------------- | ----------------------------- |
| Desktop notification | Real-time thread resurrection alert          | Dormant thread activity       |
| Slack DM             | Team-shared research surfaces, morning brief | Morning briefing, lit. watch  |
| iMessage             | Mobile catch-up, morning briefing            | Morning briefing              |
| WhatsApp             | Alternative mobile channel                   | Morning briefing (configured) |
| Email / Notion push  | Daily/weekly research digest                 | Digest schedule               |

### 9.2 Notification Format — Thread Resurrection

```
📚 NEXUS: Thread Resurface Alert

You're back on: "LLM Alignment Survey"
(Last visited: 3 days ago)

Where you left off:
→ Reading reward modeling paper (40% done)
→ Open question: RLAIF cost vs. RLHF

Top 3 prior insights:
1. Constitutional AI eliminates need for human labelers in RLHF loop
2. Bradley-Terry model underlies most preference learning setups
3. Reward hacking risk increases with reward model overfit

[ Continue thread → ] [ Dismiss ] [ Archive ]
```

### 9.3 Morning Briefing Format

```
☀️ NEXUS Morning Briefing — May 6, 2026

ACTIVE THREADS (3)

📌 LLM Alignment Survey [HIGH]
   → Left off: reward modeling paper, open question on RLAIF cost
   → NEW: 2 new arXiv papers matched overnight

📌 Distributed Systems Reading [MEDIUM]
   → Left off: Raft consensus deep dive
   → No new sources

📌 Product Strategy Research [MEDIUM]
   → Left off: Jobs-to-be-done framework comparison

🔗 NEW CONNECTION FOUND
   "LLM Alignment Survey" ↔ "Reward Modeling Basics"
   Shared concept: Bradley-Terry preference model
   [ View connection → ]

📄 OVERNIGHT PAPERS (2 new)
   • "RLHF at Scale: Cost Analysis" (arXiv, yesterday)
   • "Mitigating Reward Hacking via KL Penalty" (arXiv, 2 days ago)

Have a productive session. 🧠
```

---

## 10. Autonomous Behaviors — Detailed Logic

All five behaviors run without user input. They are orchestrated by the HEARTBEAT daemon and implemented as pluggable modules in the Skill Execution Layer.

### 10.1 Behavior 1: Session Snapshot

**Trigger:** Every HEARTBEAT tick (30 min)
**Module:** `skills/session-snapshot.js`

**Logic:**

```
1. Poll browser extension API → get current tab list
2. Poll file watcher → get modified files since last snapshot
3. Poll clipboard → get new excerpts since last snapshot
4. Identify active thread from URL/file → keyword mapping in _index.yaml
5. Write session snapshot to threads/{slug}/sessions/{ISO_timestamp}.md
6. Call LLM to update thread.md summary (2-sentence diff from prior summary)
7. Update _index.yaml → last_touched, last_snapshot for the active thread
8. If no clear thread identified → create snapshot in /unclassified/ folder
```

**Output:** One `.md` session file per thread per tick (only written if new signals exist).

### 10.2 Behavior 2: Thread Resurrection

**Trigger:** Dormant thread activity detected during any heartbeat tick
**Module:** `skills/thread-resurrection.js`

**Dormancy Definition:** `last_touched` timestamp > `dormancy_threshold_hours` (default: 72h)

**Detection Logic:**

```
1. For each signal from browser/file watcher:
   a. Extract URL or file path
   b. Match against known thread sources/files in _index.yaml
   c. If matched thread has status=dormant → trigger resurrection
2. Within 60 seconds of detection:
   a. Read thread.md → last session summary
   b. Read insights.md → top 3 insights (by recency)
   c. Read questions.md → open questions
   d. Compose resurrection notification (see 9.2 format)
   e. Deliver via desktop notification
   f. Update thread status → active in _index.yaml
```

### 10.3 Behavior 3: Connection Engine

**Trigger:** Daily at 23:00
**Module:** `skills/connection-engine.js`

**Logic:**

```
1. Load all thread insight files (threads/{slug}/insights.md)
2. For each pair of threads not already in _connections.yaml:
   a. Call LLM with both insight files → compute semantic similarity score
   b. Identify shared concepts, overlapping citations
3. For pairs with score > 0.75:
   a. Create connection entry in _connections.yaml
   b. Queue connection for user notification (surfaced_to_user: false)
4. During next morning briefing: include new connections
5. Mark connection as surfaced_to_user: true after notification
```

**Connection strength scoring:**

- Citation overlap between source sets: +0.4
- Shared keywords (from topic_keywords): +0.3 per match (max 0.3)
- LLM semantic similarity of insights: 0.0–0.3

### 10.4 Behavior 4: Morning Briefing

**Trigger:** Daily at user-configured time (default 08:30)
**Module:** `skills/morning-briefing.js`

**Logic:**

```
1. Load _index.yaml → all active threads sorted by priority, last_touched
2. For each active thread:
   a. Read last session snapshot → "left off at" summary
   b. Read new sources added since last briefing (status: new_unread)
   c. Check _connections.yaml for unsurfaced connections involving this thread
3. Compose briefing markdown (see 9.3 format)
4. Call LLM to narrativize into natural language
5. Deliver via configured morning channel(s) (iMessage, Slack, WhatsApp)
6. Write briefing to briefings/{YYYY-MM-DD}-morning.md for archival
7. Mark new sources and connections as surfaced in their respective YAML files
```

### 10.5 Behavior 5: Literature Watch

**Trigger:** Daily at 06:00 (before morning briefing runs)
**Module:** `skills/lit-watch.js`

**Logic:**

```
1. Load _index.yaml → threads with watch_sources enabled
2. For each such thread:
   a. Extract topic_keywords
   b. Query arXiv API: search_query built from keywords, sorted by submittedDate
   c. Query Semantic Scholar API: same keywords
   d. Deduplicate results across both sources
   e. Compare against existing sources.yaml (by arxiv_id or DOI)
   f. For each new paper:
      - Fetch abstract
      - Call LLM: compute relevance score vs. thread's insight summary
      - If relevance > 0.6: add to sources.yaml with status: new_unread
      - Append to overnight papers queue for morning briefing
3. Rate limit: max 10 API calls per thread per day
4. Store raw results in threads/{slug}/lit-watch-{date}.json for debugging
```

---

## 11. Agent Reasoning Loop

The Pi Engine runs NEXUS's core reasoning loop. Each behavior module is invoked within this loop.

```
EVENT RECEIVED
(tick / signal / user command)
        │
        ▼
┌─────────────────┐
│   PLAN PHASE    │
│                 │
│ Read relevant   │
│ memory files    │
│ (_index.yaml,   │
│ thread files)   │
│                 │
│ Identify which  │
│ behavior(s)     │
│ to activate     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    ACT PHASE    │
│                 │
│ Execute skill   │
│ module (JS)     │
│                 │
│ Call external   │
│ APIs as needed  │
│                 │
│ Call LLM for    │
│ text generation │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OBSERVE PHASE  │
│                 │
│ Inspect outputs │
│ Check for       │
│ errors          │
│ Validate data   │
│ schemas         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UPDATE MEMORY   │
│                 │
│ Write session   │
│ files           │
│ Update indexes  │
│ Append to logs  │
│                 │
│ Schedule next   │
│ action if needed│
└─────────────────┘
```

### 11.1 LLM Context Management

Because research threads can exceed a single LLM context window, NEXUS uses OpenClaw's **Cognitive RAM** approach:

- When calling the LLM, load ONLY the relevant thread file + last 2 session snapshots + specific insights.
- Never load the entire memory directory into the prompt.
- For the connection engine, load only the insight summaries (not full thread files).
- Token budget per call: 8,000 tokens for context, 1,000 for output.
- If thread exceeds budget: chunk insights, run multiple calls, merge summaries.

---

## 12. File & Directory Structure

Complete directory structure that any agent can replicate to set up NEXUS from scratch.

```
nexus/
├── README.md                          # This file
├── SOUL.md                            # OpenClaw personality config
├── HEARTBEAT.md                       # OpenClaw proactive behavior config
├── package.json                       # Node.js dependencies
├── tsconfig.json                      # TypeScript config
├── docker-compose.yml                 # Container orchestration
├── .env.example                       # Environment variable template
│
├── src/
│   ├── index.ts                       # Entry point — starts daemon + gateway
│   ├── gateway/
│   │   ├── server.ts                  # WebSocket server (OpenClaw Layer 3)
│   │   ├── router.ts                  # Signal routing logic
│   │   └── auth.ts                    # API key auth middleware
│   │
│   ├── engine/
│   │   ├── pi-engine.ts               # Agent loop (plan → act → observe → update)
│   │   ├── heartbeat.ts               # 30-min tick daemon
│   │   └── planner.ts                 # Behavior selection logic
│   │
│   ├── memory/
│   │   ├── index.ts                   # Memory layer public API
│   │   ├── thread-store.ts            # Read/write thread files
│   │   ├── index-store.ts             # Read/write _index.yaml
│   │   ├── connection-store.ts        # Read/write _connections.yaml
│   │   └── schema.ts                  # TypeScript types for all memory schemas
│   │
│   ├── skills/
│   │   ├── session-snapshot.ts        # Behavior 1
│   │   ├── thread-resurrection.ts     # Behavior 2
│   │   ├── connection-engine.ts       # Behavior 3
│   │   ├── morning-briefing.ts        # Behavior 4
│   │   └── lit-watch.ts              # Behavior 5
│   │
│   ├── tools/
│   │   ├── browser-extension.ts       # Browser Extension API client
│   │   ├── file-watcher.ts            # chokidar-based file monitor
│   │   ├── clipboard-monitor.ts       # Clipboard polling
│   │   ├── notion-client.ts           # Notion API wrapper
│   │   ├── obsidian-client.ts         # Obsidian Local REST API wrapper
│   │   ├── arxiv-client.ts            # arXiv Atom API client
│   │   ├── semantic-scholar.ts        # Semantic Scholar API client
│   │   └── llm-client.ts              # LLM API abstraction (Claude/GPT-4)
│   │
│   ├── channels/
│   │   ├── desktop-notify.ts          # node-notifier wrapper
│   │   ├── slack.ts                   # Slack Web API wrapper
│   │   ├── imessage.ts                # AppleScript / BlueBubbles bridge
│   │   ├── whatsapp.ts                # WhatsApp bridge (via OpenClaw)
│   │   └── email.ts                   # Nodemailer for digest delivery
│   │
│   └── utils/
│       ├── keyword-matcher.ts         # URL/file → thread slug matching
│       ├── yaml-utils.ts              # Safe YAML read/write
│       ├── markdown-utils.ts          # Markdown parsing helpers
│       └── logger.ts                  # Structured logging
│
├── browser-extension/
│   ├── manifest.json                  # Chrome/Firefox extension manifest
│   ├── background.js                  # Tab tracking service worker
│   ├── content.js                     # Reading progress tracker
│   └── api-server.js                  # Local REST API (port 9001)
│
├── prompts/
│   ├── session-summary.md             # LLM prompt: summarize session
│   ├── thread-summary.md              # LLM prompt: update thread summary
│   ├── connection-description.md      # LLM prompt: describe a connection
│   ├── morning-briefing.md            # LLM prompt: compose morning brief
│   ├── insight-extraction.md          # LLM prompt: extract insights from source
│   └── relevance-score.md             # LLM prompt: score paper relevance
│
├── tests/
│   ├── unit/
│   │   ├── memory/
│   │   ├── skills/
│   │   └── tools/
│   └── integration/
│       ├── heartbeat.test.ts
│       └── agent-loop.test.ts
│
└── scripts/
    ├── setup.sh                       # First-run setup script
    ├── reset-memory.sh                # Wipe and reinitialize memory
    └── export-digest.sh               # Manual digest generation
```

---

## 13. API Integrations & External Dependencies

### 13.1 Required APIs

| Service                      | Auth Method               | Rate Limit             | Cost                |
| ---------------------------- | ------------------------- | ---------------------- | ------------------- |
| Anthropic Claude             | API key (env var)         | 50 req/min (Sonnet)    | ~$3/M input tokens  |
| Gemini (formerly OpenAI GPT) | API key (env var)         | Tier-dependent         | ~$5/M input tokens  |
| arXiv API                    | None (public)             | Polite: 1 req/3 sec    | Free                |
| Semantic Scholar             | Optional API key          | 100 req/5 min (unauth) | Free                |
| Notion API                   | Integration Token / OAuth | 3 req/sec              | Free (for personal) |
| Slack Web API                | Bot OAuth Token           | Tier 1: 1 req/sec      | Free                |

### 13.2 Optional APIs

| Service               | Purpose                        | Auth              |
| --------------------- | ------------------------------ | ----------------- |
| Obsidian Local REST   | Read/write Obsidian vault      | Local API key     |
| BlueBubbles           | iMessage bridge (non-Mac)      | Server + password |
| SendGrid / Nodemailer | Email digest delivery          | API key           |
| RSS feeds             | Additional publication sources | None              |

### 13.3 Browser Extension

- **Chrome:** Manifest V3, Local REST API on `localhost:9001`
- **Firefox:** WebExtensions API, same local REST endpoint
- **Permissions required:** `tabs`, `activeTab`, `storage`, `scripting`

### 13.4 npm Dependencies

```json
{
  "dependencies": {
    "chokidar": "^3.6.0",
    "clipboardy": "^4.0.0",
    "node-notifier": "^10.0.1",
    "js-yaml": "^4.1.0",
    "axios": "^1.6.0",
    "@notionhq/client": "^2.2.14",
    "@slack/web-api": "^6.12.0",
    "@anthropic-ai/sdk": "^0.24.0",
    "openai": "^4.47.0",
    "ws": "^8.17.0",
    "express": "^4.18.2",
    "fast-xml-parser": "^4.3.5",
    "nodemailer": "^6.9.13",
    "winston": "^3.13.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.12.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.4"
  }
}
```

---

## 14. Environment Variables & Configuration

### 14.1 `.env` File

```bash
# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=sk-...
LLM_PRIMARY=claude                   # claude | gemini | local
LLM_FALLBACK=gemini

# Notion
NOTION_INTEGRATION_TOKEN=secret_...
NOTION_WORKSPACE_ID=...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_USER_ID=U...                   # DM target for briefings

# iMessage (AppleScript, macOS only)
IMESSAGE_RECIPIENT=+1234567890       # Phone number or Apple ID

# WhatsApp (via OpenClaw bridge)
WHATSAPP_ENABLED=false

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_RECIPIENTS=user@email.com

# Semantic Scholar
SEMANTIC_SCHOLAR_API_KEY=           # Optional; leave blank for unauthenticated

# Browser Extension
BROWSER_EXT_PORT=9001

# NEXUS Config
NEXUS_MEMORY_PATH=~/.nexus/memory
NEXUS_HEARTBEAT_INTERVAL_MIN=30
NEXUS_MORNING_BRIEFING_TIME=08:30
NEXUS_LIT_WATCH_TIME=06:00
NEXUS_CONNECTION_ENGINE_TIME=23:00
NEXUS_DORMANCY_THRESHOLD_HOURS=72
NEXUS_LOG_LEVEL=info                 # debug | info | warn | error
NEXUS_LOG_PATH=~/.nexus/logs/nexus.log
```

### 14.2 `_config.yaml` — Runtime Configuration

```yaml
# ~/.nexus/memory/_config.yaml

user:
  name: "Researcher Name"
  timezone: "Asia/Kolkata"
  morning_channel: "imessage" # imessage | slack | whatsapp | email

file_watcher:
  enabled: true
  watch_paths:
    - "~/Documents"
    - "~/research"
    - "~/Desktop"
  extensions: [".md", ".txt", ".docx", ".pdf"]
  debounce_ms: 2000

channels:
  desktop_notify: true
  slack: true
  imessage: true
  whatsapp: false
  email: true

behaviors:
  session_snapshot:
    enabled: true
    interval_min: 30
  thread_resurrection:
    enabled: true
    dormancy_threshold_hours: 72
  connection_engine:
    enabled: true
    schedule: "23:00"
    similarity_threshold: 0.75
  morning_briefing:
    enabled: true
    schedule: "08:30"
    max_threads_in_brief: 5
  lit_watch:
    enabled: true
    schedule: "06:00"
    relevance_threshold: 0.6
    max_papers_per_thread: 10

llm:
  primary: "claude-sonnet-4-20250514"
  fallback: "gpt-4o"
  max_context_tokens: 8000
  max_output_tokens: 1000
  temperature: 0.3
```

---

## 15. Setup & Installation

### 15.1 Prerequisites

```bash
node --version    # Must be ≥ 22
npm --version     # Must be ≥ 10
```

### 15.2 Install OpenClaw

```bash
# Install OpenClaw (required runtime)
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

### 15.3 Clone & Install NEXUS

```bash
git clone https://github.com/your-team/nexus-openclaw.git
cd nexus-openclaw
npm install
cp .env.example .env
# Fill in your API keys in .env
```

### 15.4 Initialize Memory

```bash
npm run setup
# This runs scripts/setup.sh which:
# 1. Creates ~/.nexus/memory/ directory structure
# 2. Writes default _index.yaml, _connections.yaml, _config.yaml
# 3. Writes SOUL.md and HEARTBEAT.md from templates
# 4. Prompts for initial thread creation (optional)
```

### 15.5 Install Browser Extension

```bash
# Chrome
# 1. Navigate to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked" → select ./browser-extension/

# Firefox
# 1. Navigate to about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on" → select ./browser-extension/manifest.json
```

### 15.6 Start NEXUS

```bash
# Development
npm run dev

# Production (background daemon)
npm run build
npm start

# With Docker (recommended for always-on)
docker-compose up -d
```

### 15.7 OpenClaw Channel Setup

```bash
# Slack
openclaw onboard --channel=slack

# iMessage (macOS only)
openclaw onboard --channel=imessage

# WhatsApp (optional)
openclaw onboard --channel=whatsapp   # QR scan
```

### 15.8 Verify Installation

```bash
npm run health-check
# Expected output:
# ✅ OpenClaw gateway: running
# ✅ Heartbeat daemon: running (next tick in 14 min)
# ✅ Browser extension: connected (port 9001)
# ✅ Memory layer: initialized (0 threads)
# ✅ LLM: claude-sonnet-4-20250514 reachable
# ✅ Channels: desktop_notify ✓ | slack ✓ | imessage ✓
```

### 15.9 Create First Research Thread

```bash
npm run thread:create
# Prompts for:
# - Thread title
# - Topic keywords (comma-separated)
# - Priority (high/medium/low)
# - Enable lit watch? (y/n)
# - Dormancy threshold (hours)
```

---

## 16. MVP Scope — Hackathon Build Plan

The MVP is designed to be completable within the hackathon timeline while demonstrating all core autonomous behaviors.

### 16.1 MVP Feature Set

| Feature                     | Priority | Status        |
| --------------------------- | -------- | ------------- |
| Memory layer (thread files) | P0       | Must build    |
| Heartbeat daemon (30-min)   | P0       | Must build    |
| Session snapshot behavior   | P0       | Must build    |
| Thread resurrection         | P0       | Must build    |
| Browser extension (basic)   | P0       | Must build    |
| Morning briefing generator  | P1       | Must build    |
| Lit. watch (arXiv only)     | P1       | Must build    |
| Desktop notifications       | P1       | Must build    |
| Connection engine           | P2       | Build if time |
| Slack DM channel            | P2       | Build if time |
| Notion integration          | P3       | Stretch goal  |
| Obsidian integration        | P3       | Stretch goal  |
| iMessage channel            | P3       | Stretch goal  |
| Clipboard monitoring        | P2       | Build if time |

### 16.2 Day-by-Day Build Plan

```
Day 1-2: Foundation
  - OpenClaw gateway setup
  - Memory layer implementation (_index.yaml, thread CRUD)
  - SOUL.md + HEARTBEAT.md templates
  - _config.yaml schema + reader

Day 3-4: Browser Extension + Snapshot
  - Browser extension (tab API, reading progress)
  - Local REST API (port 9001)
  - Session snapshot skill (Behavior 1)
  - File watcher integration

Day 5-6: Resurrection + Morning Brief
  - Thread resurrection skill (Behavior 2)
  - Morning briefing generator (Behavior 4)
  - Desktop notifications
  - LLM integration (Claude API)

Day 7: Lit Watch + Polish
  - arXiv API client (Behavior 5)
  - Slack DM channel
  - Clipboard monitor
  - End-to-end test: full heartbeat cycle
  - Demo recording

Day 8 (buffer): Connection engine + bug fixes
  - Connection engine (Behavior 3) if time permits
  - KPI instrumentation
  - README and documentation finalization
```

### 16.3 MVP Demo Scenario

**Scenario 1 — Thread Resurrection (90 seconds)**

1. Show researcher has a dormant thread "LLM Alignment Survey" (not opened in 3 days)
2. Researcher opens an arXiv tab matching the thread
3. NEXUS detects within the next heartbeat tick
4. Desktop notification fires within 60 seconds with full context brief
5. Researcher clicks → sees where they left off, prior insights, open questions

**Scenario 2 — Morning Briefing (60 seconds)**

1. Show 8:30 AM trigger
2. NEXUS composes and delivers briefing to Slack/iMessage
3. Briefing shows: 3 active threads, 2 new overnight arXiv papers, 1 new connection discovered

**Scenario 3 — Live Session Snapshot (60 seconds)**

1. Researcher opens 3 research tabs
2. 30-minute heartbeat tick runs (demo with shortened 1-min tick for live demo)
3. NEXUS writes session snapshot — show the generated markdown file
4. Thread `_index.yaml` updated in real-time — show diff

---

## 17. Evaluation Criteria Alignment

| Criterion                                      | How NEXUS Addresses It                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Working Prototype / Functionality (35%)        | Full end-to-end autonomous loop: heartbeat → snapshot → resurrection → briefing. All 5 behaviors runnable in demo.                      |
| Technical Depth of Contribution (25%)          | Novel cross-session connection engine, semantic similarity scoring, multi-API orchestration, LLM context management strategy.           |
| User Experience / Novelty (15%)                | Zero-friction: user does nothing different. Ambient intelligence. Morning briefings on mobile. Thread resurrection in under 60 seconds. |
| Relevance to Theme & Business Importance (15%) | Directly solves the "where was I?" productivity problem. Quantifiable ROI: 2–4 hours/week recovered per user.                           |
| Presentation & Documentation (10%)             | This README + architecture diagram + demo video + clean GitHub repo with working build.                                                 |

---

## 18. Future Scale Vision

### 18.1 Team / Enterprise Features

- **Shared thread spaces:** Multiple team members contribute to the same research thread. NEXUS surfaces connections across team members' individual sessions.
- **Conflict detection:** "You and Sarah are both researching the same framework independently — here's what she found."
- **Knowledge graph UI:** A visual browser for the `_connections.yaml` graph, rendered as an interactive node graph.
- **Institutional knowledge capture:** As team members leave, their threads are archived and searchable by the team.

### 18.2 Platform Extensions

- **VS Code extension:** Monitors open files and code comments to capture engineering research threads.
- **Zotero integration:** Import existing citation libraries as thread seed data.
- **YouTube / podcast monitoring:** Detect research-relevant content from watched videos or listened podcasts.
- **GitHub integration:** Monitor starred repos, open issues, and README reads as research signals.

### 18.3 Revenue Model

| Tier       | Price     | Features                                         |
| ---------- | --------- | ------------------------------------------------ |
| Solo       | Free      | 3 threads, 1 channel, 30-min heartbeat           |
| Researcher | $12/month | Unlimited threads, all channels, lit. watch      |
| Team       | $49/month | Shared threads, team knowledge graph, admin      |
| Enterprise | Custom    | On-premise, SSO, audit logs, custom integrations |

### 18.4 Startup-Level Trajectory

- **0–6 months:** Open-source MVP on OpenClaw, researcher community adoption
- **6–12 months:** Managed cloud version, Notion/Obsidian plugin listing
- **12–24 months:** Team features, enterprise sales, Samsung PRISM worklet integration
- **24–36 months:** Full knowledge graph platform; acquisition target for Notion, Obsidian, or Anthropic

---

## 19. User Stories & Journeys

### 19.1 Primary User Stories

**US-001: Session Snapshot**

> As a researcher, I want NEXUS to automatically capture what I'm working on every 30 minutes, so I never have to manually log my session.

**US-002: Thread Resurrection**

> As a researcher, when I return to a topic I haven't touched in days, I want to be immediately reminded of where I left off and what I previously learned, without having to search my notes.

**US-003: Morning Briefing**

> As a researcher, I want to receive a morning summary on my phone before I open my laptop, so I know exactly which threads to continue and what new sources appeared overnight.

**US-004: Connection Discovery**

> As a researcher, I want NEXUS to tell me when two research threads I'm tracking are related, so I don't miss cross-domain insights.

**US-005: Literature Watch**

> As a researcher, I want NEXUS to monitor arXiv for new papers related to my active research threads, so I stay at the frontier without manual searching.

### 19.2 User Journey — First Day with NEXUS

```
08:30 → Researcher receives first morning briefing (empty — no threads yet)
09:00 → Creates first thread: "LLM Alignment Survey" with keywords
09:05 → Opens 4 arXiv tabs to start reading
09:35 → First heartbeat tick fires
       → NEXUS writes session snapshot
       → Thread status: active, last_touched updated
12:00 → Researcher closes laptop for lunch
14:00 → Opens laptop, opens one of the same arXiv tabs
14:01 → NEXUS detects activity on active thread (< 72h dormancy, no resurrection)
       → Snapshot captures resumed session
20:00 → Researcher returns to different topic, opens tabs from a 4-day-old session
20:01 → NEXUS detects dormant thread activity
       → Desktop notification fires within 60 seconds
       → "You're back on: Distributed Systems Reading — here's where you left off"
23:00 → Connection engine runs overnight
       → Finds 1 new connection between two active threads
08:30 (next day) → Morning briefing includes: 1 active thread, 1 new arXiv paper, 1 new connection
```

---

## 20. KPIs & Benchmarks

| KPI                               | Target             | Measurement Method                              |
| --------------------------------- | ------------------ | ----------------------------------------------- |
| Thread resurrection latency       | ≤ 60 seconds       | Time from dormant tab open to notification sent |
| Session snapshot accuracy         | ≥ 90% thread match | Manual audit of 20 snapshots vs. actual threads |
| Morning briefing delivery rate    | 100%               | Delivered vs. scheduled count over 7 days       |
| Literature watch precision        | ≥ 70% relevant     | Human rating of flagged papers (1–5 scale)      |
| Connection engine F1 score        | ≥ 0.65             | Precision/recall on 10 manually labeled pairs   |
| Context reconstruction time saved | ≥ 10 min/day       | User self-report (pre/post survey)              |
| Memory read latency               | ≤ 200ms            | Benchmark: load \_index.yaml + 3 thread files   |
| LLM call latency per behavior     | ≤ 5 seconds        | Measured in integration tests                   |
| Agent uptime                      | ≥ 99% over 7 days  | Process monitor / health check logs             |

---

## 21. AI Disclosure

As required by hackathon rules, all AI usage in preparing this project is disclosed below.

| Artifact            | AI Model/API Used             | Purpose                                      |
| ------------------- | ----------------------------- | -------------------------------------------- |
| README.md           | Claude Sonnet 4.6 (claude.ai) | Full README generation from panel evaluation |
| Architecture design | Claude Sonnet 4.6             | Architectural decisions, component design    |
| Prompt templates    | Claude Sonnet 4.6             | Initial prompt engineering for LLM skills    |
| Idea evaluation     | Claude Sonnet 4.6             | 5-persona hackathon panel evaluation         |
| Code (planned)      | Claude Sonnet API             | LLM calls within NEXUS for summarization     |

All code implementation, integration testing, and demo production are done by the human team.

---

## 22. Glossary

| Term                  | Definition                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| OpenClaw              | Autonomous AI agent framework (formerly Clawdbot/Moltbot). Open-source, self-hosted.                |
| SOUL.md               | Plain-text file defining agent personality, rules, and behavioral boundaries in OpenClaw.           |
| HEARTBEAT.md          | OpenClaw configuration file that defines proactive, time-based agent behaviors.                     |
| HEARTBEAT daemon      | Background process that reads HEARTBEAT.md and fires behavior triggers on a schedule.               |
| Pi Engine             | OpenClaw's agent reasoning core; runs the plan → act → observe → update loop.                       |
| Skill                 | A pluggable tool or behavior module in OpenClaw's execution layer.                                  |
| Thread                | A named research topic tracked by NEXUS; has its own memory files, sources, insights, sessions.     |
| Session snapshot      | A timestamped markdown file capturing the researcher's active state at a heartbeat tick.            |
| Thread resurrection   | Behavior that detects return to a dormant thread and immediately resurfaces prior context.          |
| Connection engine     | Nightly behavior that computes semantic similarity between threads and surfaces cross-domain links. |
| Morning briefing      | Daily AI-composed summary of all active threads, new papers, and connections, delivered on mobile.  |
| Literature watch      | Daily behavior that monitors arXiv and Semantic Scholar for new papers matching thread keywords.    |
| Dormant thread        | A thread whose `last_touched` timestamp exceeds the configured dormancy threshold (default: 72h).   |
| \_index.yaml          | Master registry of all threads — status, timestamps, keywords, counts.                              |
| \_connections.yaml    | Graph file recording discovered semantic connections between threads.                               |
| Cognitive RAM         | OpenClaw's memory paging approach — loading only relevant context into the LLM window as needed.    |
| Browser Extension API | Local REST API (port 9001) exposed by the NEXUS browser extension for tab state access.             |
| Protocol Adapter      | OpenClaw Layer 2 component that normalizes all communication channels into a unified interface.     |
| NEXUS                 | Neural EXperience & Understanding Synthesizer — this project.                                       |

---

_Built for the CLASH OF THE CLAWS — OpenClaw Hackathon 2026_
_Theme 3: Productivity Platforms | Prize Pool: ₹80,000_
_Framework: OpenClaw (openclaw.ai) | LLM: Anthropic Claude_
