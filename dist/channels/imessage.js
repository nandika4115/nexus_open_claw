import os from "os";
import { execFile } from "child_process";
export class IMessageChannel {
    recipient;
    constructor(recipient) {
        this.recipient = recipient;
    }
    async send(text) {
        if (os.platform() !== "darwin") {
            throw new Error("iMessage channel requires macOS");
        }
        const script = `tell application \"Messages\" to send \"${escapeAppleScript(text)}\" to buddy \"${escapeAppleScript(this.recipient)}\"`;
        await new Promise((resolve, reject) => {
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
function escapeAppleScript(text) {
    return text.replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
}
