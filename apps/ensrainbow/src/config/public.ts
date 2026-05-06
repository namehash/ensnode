import packageJson from "@/../package.json" with { type: "json" };

import type { EnsRainbowServerLabelSet, EnsRainbowVersionInfo } from "@ensnode/ensnode-sdk";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import type { DbConfig } from "./types";

/** Builds public config from a label set (CLI/env before DB open, or from DB after open). */
export function buildEnsRainbowPublicConfigFromLabelSet(
  serverLabelSet: EnsRainbowServerLabelSet,
): EnsRainbow.ENSRainbowPublicConfig {
  const versionInfo = {
    ensRainbow: packageJson.version,
  } satisfies EnsRainbowVersionInfo;

  return {
    serverLabelSet,
    versionInfo,
  };
}

export function buildEnsRainbowPublicConfig(dbConfig: DbConfig): EnsRainbow.ENSRainbowPublicConfig {
  return buildEnsRainbowPublicConfigFromLabelSet(dbConfig.serverLabelSet);
}
