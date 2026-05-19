import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const EXAMPLE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "examples",
  "omnigraph-graphql-example",
);

// TODO: uncomment when v2-sepolia (and other hosted instances) expose materialized
// `canonical { name { interpreted } }` so examples can use the local orchestrator ENSApi.
describe.skip("omnigraph-graphql-example", () => {
  it("smoke test: completes against the configured ENSNode with exit code 0", () => {
    const result = spawnSync("pnpm", ["start"], {
      cwd: EXAMPLE_DIR,
      env: process.env,
      encoding: "utf8",
      timeout: 10_000,
    });

    // log into vitest's stdout capture so --silent passed-only hides it on success
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    expect(result.status).toBe(0);
  }, 10_000);
});
