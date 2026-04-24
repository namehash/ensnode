import packageJson from "@/../package.json" with { type: "json" };

import type { EnsRainbowVersionInfo } from "@ensnode/ensnode-sdk";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import type { DbConfig } from "./types";

export function buildEnsRainbowPublicConfig(dbConfig: DbConfig): EnsRainbow.ENSRainbowPublicConfig {
  const versionInfo = {
    ensRainbow: packageJson.version,
  } satisfies EnsRainbowVersionInfo;

  return {
    serverLabelSet: dbConfig.serverLabelSet,
    versionInfo,
  };
}
