import type { EnsRainbowServerLabelSet } from "./types";

/**
 * Complete public configuration object for ENSRainbow.
 *
 * Contains all public configuration information about the ENSRainbow service instance,
 * including version, label set information, and record counts.
 */
export interface EnsRainbowPublicConfig {
  /**
   * ENSRainbow service version
   *
   * @see https://ghcr.io/namehash/ensnode/ensrainbow
   */
  version: string;

  /**
   * The label set reference managed by the ENSRainbow server.
   */
  labelSet: EnsRainbowServerLabelSet;

  /**
   * The total count of records managed by the ENSRainbow service.
   */
  recordsCount: number;
}
