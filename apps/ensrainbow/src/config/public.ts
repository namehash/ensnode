import packageJson from "@/../package.json" with { type: "json" };

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import type { ENSRainbowEnvConfig } from "./types";

export function buildENSRainbowPublicConfig(
  _config: ENSRainbowEnvConfig, // kept for semantic purposes
  labelSet: EnsRainbowServerLabelSet,
  recordsCount: number,
): EnsRainbow.ENSRainbowPublicConfig {
  return {
    version: packageJson.version,
    labelSet,
    recordsCount,
  };
}
