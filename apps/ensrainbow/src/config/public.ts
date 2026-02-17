import packageJson from "@/../package.json" with { type: "json" };

import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import type { DbConfig } from "./types";

export function buildENSRainbowPublicConfig(dbConfig: DbConfig): EnsRainbow.ENSRainbowPublicConfig {
  return {
    version: packageJson.version,
    labelSet: dbConfig.labelSet,
    recordsCount: dbConfig.recordsCount,
  };
}
