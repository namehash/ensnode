import type { z } from "zod/v4";

import type { ENSIndexerPublicConfig } from "../../ensindexer";
import type { TheGraphCannotFallbackReasonSchema, TheGraphFallbackSchema } from "./zod-schemas";

export type TheGraphCannotFallbackReason = z.infer<typeof TheGraphCannotFallbackReasonSchema>;
export type TheGraphFallback = z.infer<typeof TheGraphFallbackSchema>;

/**
 * Complete public configuration object for ENSApi.
 *
 * Contains ENSApi-specific configuration at the top level and
 * embeds the complete ENSIndexer public configuration.
 */
export interface ENSApiPublicConfig {
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
  ensIndexerPublicConfig: ENSIndexerPublicConfig;
}
