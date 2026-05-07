import type { EnsIndexerPublicConfig } from "../../ensindexer/config/types";
import type { TheGraphCannotFallbackReason, TheGraphFallback } from "../../shared/config/thegraph";

export type { TheGraphCannotFallbackReason, TheGraphFallback };

/**
 * Version info about ENSApi and its dependencies.
 */
export interface EnsApiVersionInfo {
  /**
   * ENSApi service version
   *
   * @see https://ghcr.io/namehash/ensnode/ensapi
   */
  ensApi: string;

  /**
   * ENS Normalize package version
   *
   * Available on NPM as: `@adraffy/ens-normalize`
   *
   * @see https://www.npmjs.com/package/@adraffy/ens-normalize
   **/
  ensNormalize: string;
}

/**
 * Complete public configuration object for ENSApi.
 *
 * Contains ENSApi-specific configuration at the top level and
 * embeds the complete ENSIndexer public configuration.
 */
export interface EnsApiPublicConfig {
  /**
   * The Graph Fallback-related info.
   */
  theGraphFallback: TheGraphFallback;

  /**
   * Complete ENSIndexer public configuration
   *
   * Contains all ENSIndexer public configuration including
   * namespace, plugins, version info, etc.
   */
  ensIndexerPublicConfig: EnsIndexerPublicConfig;

  /**
   * Version info about ENSApi.
   */
  versionInfo: EnsApiVersionInfo;
}

/**
 * ENSApi Public Config
 *
 * @deprecated Use {@link EnsApiPublicConfig} instead.
 */
export type ENSApiPublicConfig = EnsApiPublicConfig;
