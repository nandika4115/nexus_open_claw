const API_BASE = "http://localhost:9001";
const TAB_STATE = new Map();
const HISTORY = [];
let activeTabId = null;
let activeSince = Date.now();

function recordTabTime(tabId) {
  if (activeTabId === null) {
    return;
  }
  const now = Date.now();
  const elapsed = Math.floor((now - activeSince) / 1000);
  const state = TAB_STATE.get(activeTabId);
  if (state) {
    state.timeOnPage += elapsed;
  }
  activeTabId = tabId;
  activeSince = now;
}

chrome.tabs.onActivated.addListener(async (info) => {
  recordTabTime(info.tabId);
  const tab = await chrome.tabs.get(info.tabId);
  updateTabState(tab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateTabState(tab);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message?.type === "progress") {
    const state = TAB_STATE.get(message.tabId);
    if (state) {
      state.readingProgress = message.progress;
    }
  }
});

chrome.alarms.create("nexus_sync", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "nexus_sync") {
    return;
  }
  await pushSnapshot();
});

function updateTabState(tab) {
  if (!tab || !tab.url || !tab.title) {
    return;
  }
  const existing = TAB_STATE.get(tab.id) ?? {
    url: tab.url,
    title: tab.title,
    timeOnPage: 0,
    readingProgress: 0,
    windowActive: tab.active,
    tabIndex: tab.index
  };
  existing.url = tab.url;
  existing.title = tab.title;
  existing.windowActive = tab.active;
  existing.tabIndex = tab.index;
  TAB_STATE.set(tab.id, existing);
}

async function pushSnapshot() {
  recordTabTime(activeTabId);
  const tabs = Array.from(TAB_STATE.entries()).map(([tabId, state]) => ({
    ...state,
    tabId
  }));
  const payload = {
    tabs,
    history: HISTORY.slice(-100),
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(`${API_BASE}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    // Ignore transient failures; server may not be running.
  }
}
