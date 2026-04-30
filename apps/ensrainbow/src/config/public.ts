import packageJson from "@/../package.json" with { type: "json" };

import type { EnsRainbowServerLabelSet, EnsRainbowVersionInfo } from "@ensnode/ensnode-sdk";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import type { DbConfig } from "./types";

/**
 * Build an `EnsRainbowPublicConfig` from a known `EnsRainbowServerLabelSet`.
 *
 * Used by both:
 * - the eager startup path (entrypoint command), where the label set comes from CLI/env args
 *   and the database has not yet been opened, and
 * - the post-bootstrap path, where the label set comes from the opened database.
 */
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
