import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(PKG_DIR, "dist", "cli.js");

function runCli(args: string[]) {
  return spawnSync("node", [CLI, ...args], { cwd: PKG_DIR, env: process.env, encoding: "utf8" });
}

// Build the self-contained bin (inlines the Omnigraph SDL) and spawn the built artifact, mirroring
// how a published `enscli` runs.
beforeAll(() => {
  execFileSync("pnpm", ["build"], { cwd: PKG_DIR, stdio: "ignore" });
}, 60_000);

describe("enscli", () => {
  it("namehash: computes the node (no network)", () => {
    const result = runCli(["namehash", "vitalik.eth"]);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      name: "vitalik.eth",
      node: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
    });
  });

  it("labelhash: computes the labelHash (no network)", () => {
    const result = runCli(["labelhash", "vitalik"]);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).labelHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("omnigraph schema: describes a type from the bundled SDL (no network)", () => {
    const result = runCli(["ensnode", "omnigraph", "schema", "Domain"]);
    expect(result.status).toBe(0);
    const schema = JSON.parse(result.stdout);
    expect(schema.name).toBe("Domain");
    expect(schema.fields.map((field: { name: string }) => field.name)).toContain("canonical");
  });

  it("rejects hallucinated identifiers with a structured error and non-zero exit", () => {
    const result = runCli(["namehash", "vitalik?.eth"]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: { message: expect.stringContaining("forbidden") },
    });
  });

  it("omnigraph: executes a query against the devnet", () => {
    const result = runCli([
      "ensnode",
      "omnigraph",
      '{ domain(by: { name: "eth" }) { id } }',
      "--ensnode-url",
      process.env.ENSNODE_URL ?? "http://localhost:4334",
    ]);
    expect(result.status).toBe(0);
    const response = JSON.parse(result.stdout);
    expect(response.errors).toBeUndefined();
    expect(response).toHaveProperty("data");
  });

  it("indexing-status: fetches status from the devnet", () => {
    const result = runCli([
      "ensnode",
      "indexing-status",
      "--ensnode-url",
      process.env.ENSNODE_URL ?? "http://localhost:4334",
    ]);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toBeTypeOf("object");
  });
});
