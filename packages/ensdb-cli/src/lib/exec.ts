import { spawn } from "node:child_process";

export interface RunResult {
  stdout: string;
  stderr: string;
}

/**
 * Run a command to completion, rejecting on a non-zero exit code. Output is captured rather than
 * inherited so callers can parse it (e.g. `pg_restore --list`).
 */
export function run(command: string, args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} exited with code ${code}: ${stderr.trim() || stdout.trim()}`));
      }
    });
  });
}
