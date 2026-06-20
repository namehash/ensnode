import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { EnvironmentDefaults } from "./environment-defaults";

const CONFIGS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../configs");

/** Minimal dotenv parser: `KEY=VALUE` lines, ignoring blanks and `#` comments. */
function parseEnvFile(name: string): Record<string, string> {
  const text = readFileSync(join(CONFIGS_DIR, name), "utf-8");
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

describe("named configs (build_id parity contract)", () => {
  it("configs/alpha.env = EnvironmentDefaults.alpha + efp on the mainnet namespace", () => {
    const alpha = parseEnvFile("alpha.env");
    expect(alpha).toMatchObject({
      NAMESPACE: "mainnet",
      SUBGRAPH_COMPAT: "false",
      // EFP is excluded from the shared default (mainnet-only datasources), added explicitly here.
      PLUGINS: `${EnvironmentDefaults.alpha.PLUGINS},efp`,
      LABEL_SET_ID: EnvironmentDefaults.alpha.LABEL_SET_ID,
      LABEL_SET_VERSION: EnvironmentDefaults.alpha.LABEL_SET_VERSION,
    });
  });

  it("configs/mainnet.env = EnvironmentDefaults.subgraphCompatible on the mainnet namespace", () => {
    const mainnet = parseEnvFile("mainnet.env");
    expect(mainnet).toMatchObject({
      NAMESPACE: "mainnet",
      SUBGRAPH_COMPAT: "true",
      PLUGINS: EnvironmentDefaults.subgraphCompatible.PLUGINS,
      LABEL_SET_ID: EnvironmentDefaults.subgraphCompatible.LABEL_SET_ID,
      LABEL_SET_VERSION: EnvironmentDefaults.subgraphCompatible.LABEL_SET_VERSION,
    });
  });
});
