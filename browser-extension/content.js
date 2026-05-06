function computeProgress() {
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight || document.body.scrollHeight;
  const clientHeight = doc.clientHeight || window.innerHeight;
  const total = Math.max(1, scrollHeight - clientHeight);
  return Math.min(1, scrollTop / total);
}

function sendProgress() {
  const progress = computeProgress();
  chrome.runtime.sendMessage({
    type: "progress",
    tabId: null,
    progress
  });
}

window.addEventListener("scroll", () => {
  sendProgress();
});

setInterval(sendProgress, 10000);
