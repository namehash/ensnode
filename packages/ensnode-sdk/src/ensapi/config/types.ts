import type { EnsIndexerPublicConfig } from "../../ensindexer/config/types";
import type { TheGraphCannotFallbackReason, TheGraphFallback } from "../../shared/config/thegraph";

export type { TheGraphCannotFallbackReason, TheGraphFallback };

/**
 * Complete public configuration object for ENSApi.
 *
 * Contains ENSApi-specific configuration at the top level and
 * embeds the complete ENSIndexer public configuration.
 */
export interface EnsApiPublicConfig {
  /**
   * ENSApi service version
   *
   * @see https://ghcr.io/namehash/ensnode/ensapi
   */
  version: string;

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
}

/**
 * ENSApi Public Config
 *
 * @deprecated Use {@link EnsApiPublicConfig} instead.
 */
export type ENSApiPublicConfig = EnsApiPublicConfig;
