import { spawn } from "node:child_process";

export interface RunResult {
  stdout: string;
  stderr: string;
}

/**
 * Default subprocess timeout (6 hours). `pg_dump`/`pg_restore` over the network can legitimately
 * run for hours on large schemas, but should never hang forever (e.g. on a lock or a dropped
 * connection). Override per-call via the `timeoutMs` option or globally via `$ENSDB_CLI_TIMEOUT_MS`.
 */
const DEFAULT_TIMEOUT_MS = 6 * 60 * 60 * 1000;

function defaultTimeoutMs(): number {
  const env = process.env.ENSDB_CLI_TIMEOUT_MS;
  if (env === undefined) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(env);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`invalid ENSDB_CLI_TIMEOUT_MS: ${env}`);
  }
  return parsed;
}

export interface RunOptions {
  /** Milliseconds before the child is killed and the call rejects. Defaults to {@link defaultTimeoutMs}. */
  timeoutMs?: number;
}

/**
 * Run a command to completion, rejecting on a non-zero exit code. Output is captured rather than
 * inherited so callers can parse it (e.g. `pg_restore --list`). If the child does not exit within
 * the timeout it is killed and the call rejects with a clear error.
 */
export function run(command: string, args: string[], options: RunOptions = {}): Promise<RunResult> {
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs();

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`${command} timed out after ${timeoutMs}ms and was killed`));
      } else if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} exited with code ${code}: ${stderr.trim() || stdout.trim()}`));
      }
    });
  });
}
