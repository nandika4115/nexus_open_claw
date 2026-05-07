const state = {
  threads: [],
  selectedSlug: null
};

const threadList = document.querySelector("#thread-list");
const statusGrid = document.querySelector("#status-grid");
const threadForm = document.querySelector("#thread-form");
const threadTitle = document.querySelector("#thread-title");
const threadMeta = document.querySelector("#thread-meta");
const threadDetail = document.querySelector("#thread-detail");
const browserTabs = document.querySelector("#browser-tabs");
const toast = document.querySelector("#toast");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed: ${response.status}`);
  }
  return data;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function renderStatus(status) {
  const cards = [
    ["Threads", status.threadCount],
    ["Sources", status.sourceCount],
    ["OpenClaw", status.openclaw?.gateway ? "Gateway up" : status.openclaw?.cli ? "CLI ready" : "Offline"],
    ["Browser", status.browser?.connected ? `${status.browser.tabCount} tabs` : "Waiting"]
  ];

  statusGrid.innerHTML = cards
    .map(
      ([label, value]) => `
        <div class="status-card">
          <strong>${escapeHtml(String(value))}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `
    )
    .join("");
}

function renderThreads() {
  if (state.threads.length === 0) {
    threadList.innerHTML = `<div class="empty-state">No threads yet.</div>`;
    return;
  }

  threadList.innerHTML = state.threads
    .map(
      (thread) => `
        <button class="thread-item ${thread.slug === state.selectedSlug ? "active" : ""}" data-slug="${escapeHtml(thread.slug)}">
          <strong>${escapeHtml(thread.title)}</strong>
          <span>${thread.source_count} sources - ${escapeHtml(thread.priority)}</span>
        </button>
      `
    )
    .join("");

  for (const button of threadList.querySelectorAll("button[data-slug]")) {
    button.addEventListener("click", () => selectThread(button.dataset.slug));
  }
}

function sourceAuthors(source) {
  const authors = Array.isArray(source.authors) ? source.authors : [];
  return authors.length > 0 ? authors.slice(0, 4).join(", ") : "Unknown authors";
}

async function selectThread(slug) {
  state.selectedSlug = slug;
  renderThreads();
  const detail = await api(`/api/threads/${encodeURIComponent(slug)}`);

  threadTitle.textContent = detail.thread.title;
  threadMeta.textContent = `${detail.sources.length} sources - ${detail.thread.watch_sources.join(", ") || "not watched"}`;

  const sourcesHtml =
    detail.sources.length === 0
      ? `<div class="empty-state">No sources yet. Run lit watch to discover papers.</div>`
      : `<div class="sources">${detail.sources
          .map(
            (source) => `
              <article class="source">
                <a href="${escapeAttr(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)}</a>
                <p>${escapeHtml(sourceAuthors(source))}</p>
                <p>Status: ${escapeHtml(source.status ?? "new")}</p>
              </article>
            `
          )
          .join("")}</div>`;

  threadDetail.className = "detail-body";
  threadDetail.innerHTML = sourcesHtml;
}

async function loadThreads() {
  state.threads = await api("/api/threads");
  if (!state.selectedSlug && state.threads[0]) {
    state.selectedSlug = state.threads[0].slug;
  }
  renderThreads();
  if (state.selectedSlug) {
    await selectThread(state.selectedSlug);
  }
}

async function loadStatus() {
  renderStatus(await api("/api/status"));
}

function renderTabs(tabs) {
  if (tabs.length === 0) {
    browserTabs.innerHTML = `<div class="empty-state compact">No browser context yet. Start the browser API bridge, reload the extension, then click Sync now.</div>`;
    return;
  }

  browserTabs.innerHTML = tabs
    .map((tab) => {
      const progress = Math.max(0, Math.min(100, Math.round(Number(tab.readingProgress ?? 0) * 100)));
      const minutes = Math.max(0, Math.round(Number(tab.timeOnPage ?? 0) / 60));
      const active = tab.windowActive ? `<span class="pill good">active</span>` : `<span class="pill">background</span>`;
      return `
        <article class="tab">
          <div class="tab-title-row">
            <a href="${escapeAttr(tab.url)}" target="_blank" rel="noreferrer">${escapeHtml(tab.title ?? "Untitled")}</a>
            ${active}
          </div>
          <p class="url">${escapeHtml(tab.url ?? "")}</p>
          <div class="progress" aria-label="${progress}% read"><div style="width:${progress}%"></div></div>
          <p>${progress}% read - ${minutes} min</p>
        </article>
      `;
    })
    .join("");
}

async function loadTabs() {
  renderTabs(await api("/api/browser/tabs"));
}

threadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(threadForm);
  const watchSources = formData.getAll("watch_sources");
  const payload = {
    title: formData.get("title"),
    topic_keywords: formData.get("topic_keywords"),
    priority: formData.get("priority"),
    watch_sources: watchSources
  };

  const created = await api("/api/threads", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  state.selectedSlug = created.thread.slug;
  threadForm.reset();
  threadForm.querySelector('input[value="core"]').checked = true;
  showToast("Thread created");
  await refreshAll();
});

document.querySelector("#run-lit-watch").addEventListener("click", async () => {
  showToast("Running lit watch...");
  await api("/api/lit-watch", { method: "POST", body: "{}" });
  showToast("Lit watch complete");
  await refreshAll();
});

document.querySelector("#refresh-tabs").addEventListener("click", loadTabs);

document.querySelector("#import-tabs").addEventListener("click", async () => {
  if (!state.selectedSlug) {
    showToast("Select a thread first");
    return;
  }
  const result = await api(`/api/threads/${encodeURIComponent(state.selectedSlug)}/import-tabs`, {
    method: "POST",
    body: "{}"
  });
  showToast(`Saved ${result.imported} browser tab source${result.imported === 1 ? "" : "s"}`);
  await refreshAll();
});

async function refreshAll() {
  await Promise.all([loadStatus(), loadThreads(), loadTabs()]);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function escapeAttr(value) {
  return escapeHtml(String(value ?? ""));
}

refreshAll().catch((error) => showToast(error.message));
