import packageJson from "@/../package.json" with { type: "json" };

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import type { ArgsConfig } from "./types";

export function buildENSRainbowPublicConfig(
  _argsConfig: ArgsConfig, // kept for semantic purposes
  labelSet: EnsRainbowServerLabelSet,
  recordsCount: number,
): EnsRainbow.ENSRainbowPublicConfig {
  return {
    version: packageJson.version,
    labelSet,
    recordsCount,
  };
}
