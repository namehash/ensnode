import type { EnsRainbowServerLabelSet } from "./types";

/**
 * Version info about ENSRainbow and its dependencies.
 */
export interface EnsRainbowVersionInfo {
  /**
   * ENSRainbow service version
   *
   * @see https://ghcr.io/namehash/ensnode/ensrainbow
   **/
  ensRainbow: string;
}

/**
 * Complete public configuration object for ENSRainbow.
 *
 * Contains all public configuration information about the ENSRainbow service instance.
 */
export interface EnsRainbowPublicConfig {
  /**
   * The label set reference managed by the ENSRainbow server.
   */
  serverLabelSet: EnsRainbowServerLabelSet;

  /**
   * ENSRainbow version info
   */
  versionInfo: EnsRainbowVersionInfo;
}
