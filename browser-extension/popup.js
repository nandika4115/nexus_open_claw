async function getBridgeState() {
  const background = await chrome.runtime.sendMessage({ type: "status" });
  let apiOk = false;
  try {
    const response = await fetch(`${background.apiBase}/tabs`);
    apiOk = response.ok;
  } catch {
    apiOk = false;
  }
  return { ...background, apiOk };
}

async function render() {
  const state = await getBridgeState();
  document.querySelector("#tab-count").textContent = String(state.tabCount ?? 0);
  document.querySelector("#api-state").textContent = state.apiOk ? "Online" : "Offline";
  document.querySelector("#status").textContent = state.apiOk
    ? "Browser context is syncing."
    : "Start the local browser API bridge.";
}

document.querySelector("#sync-now").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "sync_now" });
  await render();
});

render();
