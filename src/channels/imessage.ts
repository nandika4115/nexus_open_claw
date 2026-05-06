import os from "os";
import { execFile } from "child_process";

export class IMessageChannel {
  private readonly recipient: string;

  constructor(recipient: string) {
    this.recipient = recipient;
  }

  async send(text: string): Promise<void> {
    if (os.platform() !== "darwin") {
      throw new Error("iMessage channel requires macOS");
    }
    const script = `tell application \"Messages\" to send \"${escapeAppleScript(text)}\" to buddy \"${escapeAppleScript(
      this.recipient
    )}\"`;
    await new Promise<void>((resolve, reject) => {
      execFile("osascript", ["-e", script], (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

function escapeAppleScript(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
}
