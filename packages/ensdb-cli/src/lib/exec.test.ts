import { describe, expect, it } from "vitest";

import { run } from "./exec";

describe("run", () => {
  it("captures stdout from a successful command", async () => {
    await expect(run("node", ["-e", "process.stdout.write('hi')"])).resolves.toMatchObject({
      stdout: "hi",
    });
  });

  it("rejects on a non-zero exit code with captured stderr", async () => {
    await expect(
      run("node", ["-e", "process.stderr.write('boom'); process.exit(2)"]),
    ).rejects.toThrow(/exited with code 2: boom/);
  });

  it("kills the child and rejects when it exceeds the timeout", async () => {
    await expect(
      run("node", ["-e", "setTimeout(() => {}, 60000)"], { timeoutMs: 50 }),
    ).rejects.toThrow(/timed out after 50ms/);
  });
});
