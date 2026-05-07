import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface OpenClawCliOptions {
  command?: string;
  timeoutMs?: number;
}

export interface OpenClawResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

function defaultOpenClawCommand(): string {
  return process.platform === "win32" ? "openclaw.cmd" : "openclaw";
}

export class OpenClawCli {
  private readonly command: string;
  private readonly timeoutMs: number;

  constructor(options: OpenClawCliOptions = {}) {
    this.command = options.command ?? defaultOpenClawCommand();
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  async run(args: string[], timeoutMs = this.timeoutMs): Promise<OpenClawResult> {
    try {
      const { stdout, stderr } = await execFileAsync(this.command, args, {
        timeout: timeoutMs,
        shell: process.platform === "win32",
        windowsHide: true,
        maxBuffer: 1024 * 1024
      });

      return {
        ok: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0
      };
    } catch (error) {
      const failed = error as Error & {
        code?: number | string;
        stdout?: string;
        stderr?: string;
      };

      return {
        ok: false,
        stdout: String(failed.stdout ?? "").trim(),
        stderr: String(failed.stderr ?? failed.message ?? "").trim(),
        exitCode: typeof failed.code === "number" ? failed.code : null
      };
    }
  }

  async version(): Promise<OpenClawResult> {
    return this.run(["--version"], 5000);
  }

  async health(): Promise<OpenClawResult> {
    return this.run(["health", "--json"], this.timeoutMs);
  }

  async sendMessage(input: {
    channel: string;
    target: string;
    message: string;
  }): Promise<OpenClawResult> {
    return this.run(
      [
        "message",
        "send",
        "--channel",
        input.channel,
        "--target",
        input.target,
        "--message",
        input.message,
        "--json"
      ],
      this.timeoutMs
    );
  }
}
