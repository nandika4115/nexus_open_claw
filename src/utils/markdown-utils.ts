export function extractSection(markdown: string, heading: string): string | null {
  const regex = new RegExp(`(^##\\s+${escapeRegExp(heading)}\\n)([\\s\\S]*?)(?=^##\\s+|$)`, "m");
  const match = markdown.match(regex);
  if (!match) {
    return null;
  }
  const content = match[2];
  return content ? content.trim() : null;
}

export function replaceSection(markdown: string, heading: string, content: string): string {
  const regex = new RegExp(`(^##\\s+${escapeRegExp(heading)}\\n)([\\s\\S]*?)(?=^##\\s+|$)`, "m");
  if (!regex.test(markdown)) {
    return `${markdown.trim()}\n\n## ${heading}\n${content.trim()}\n`;
  }
  return markdown.replace(regex, `## ${heading}\n${content.trim()}\n`);
}

export function formatSessionSnapshot(payload: {
  timestamp: string;
  duration?: string;
  activeThread?: string;
  openTabs: Array<{ title: string; url: string; progress?: number }>;
  clipboardEntries: string[];
  modifiedFiles: string[];
  observations: string[];
  nextSessionHint?: string;
}): string {
  const lines: string[] = [];
  lines.push(`# Session Snapshot — ${payload.timestamp}`);
  lines.push("");
  if (payload.duration) {
    lines.push(`**Duration:** ${payload.duration}`);
  }
  if (payload.activeThread) {
    lines.push(`**Active Thread:** ${payload.activeThread}`);
  }
  lines.push("");
  lines.push("## Open Tabs at Snapshot");
  if (payload.openTabs.length === 0) {
    lines.push("- None");
  } else {
    for (const tab of payload.openTabs) {
      const progress = tab.progress !== undefined ? ` — ${Math.round(tab.progress * 100)}% read` : "";
      lines.push(`- [${tab.title}](${tab.url})${progress}`);
    }
  }
  lines.push("");
  lines.push("## Recently Copied to Clipboard");
  if (payload.clipboardEntries.length === 0) {
    lines.push("- None");
  } else {
    for (const entry of payload.clipboardEntries) {
      lines.push(`> ${entry}`);
    }
  }
  lines.push("");
  lines.push("## Files Modified This Session");
  if (payload.modifiedFiles.length === 0) {
    lines.push("- None");
  } else {
    for (const file of payload.modifiedFiles) {
      lines.push(`- ${file}`);
    }
  }
  if (payload.observations.length > 0) {
    lines.push("");
    lines.push("## Agent Observations");
    for (const observation of payload.observations) {
      lines.push(`- ${observation}`);
    }
  }
  if (payload.nextSessionHint) {
    lines.push("");
    lines.push("## Suggested Next Session Start");
    lines.push(payload.nextSessionHint);
  }
  lines.push("");
  return lines.join("\n");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}
