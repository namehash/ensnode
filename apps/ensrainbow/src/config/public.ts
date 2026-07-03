import packageJson from "@/../package.json" with { type: "json" };

import type { EnsRainbowServerLabelSet, EnsRainbowVersionInfo } from "@ensnode/ensnode-sdk";
import { buildCommitRef } from "@ensnode/ensnode-sdk/internal";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import type { ENSRainbowEnvironment } from "@/config/environment";

import type { DbConfig } from "./types";

/**
 * Get ENSRainbow codebase commit reference
 */
export function getEnsRainbowCommitRef(): string | undefined {
  return buildCommitRef(process.env satisfies ENSRainbowEnvironment);
}

/**
 * Get ENSRainbow version
 */
function getEnsRainbowVersion(): string {
  return packageJson.version;
}

/** Builds public config from a label set (CLI/env before DB open, or from DB after open). */
export function buildEnsRainbowPublicConfigFromLabelSet(
  serverLabelSet: EnsRainbowServerLabelSet,
): EnsRainbow.ENSRainbowPublicConfig {
  const versionInfo = {
    commit: getEnsRainbowCommitRef(),
    ensRainbow: getEnsRainbowVersion(),
  } satisfies EnsRainbowVersionInfo;

  return {
    serverLabelSet,
    versionInfo,
  };
}

export function buildEnsRainbowPublicConfig(dbConfig: DbConfig): EnsRainbow.ENSRainbowPublicConfig {
  return buildEnsRainbowPublicConfigFromLabelSet(dbConfig.serverLabelSet);
}
