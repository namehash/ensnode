import { serializeEnsIndexerPublicConfig } from "../../ensindexer/config/serialize";
import type { SerializedEnsApiPublicConfig } from "./serialized-types";
import type { EnsApiPublicConfig } from "./types";

/**
 * Serialize a {@link EnsApiPublicConfig} object.
 */
export function serializeEnsApiPublicConfig(
  config: EnsApiPublicConfig,
): SerializedEnsApiPublicConfig {
  const { version, theGraphFallback, ensIndexerPublicConfig } = config;

  return {
    version,
    theGraphFallback,
    ensIndexerPublicConfig: serializeEnsIndexerPublicConfig(ensIndexerPublicConfig),
  } satisfies SerializedEnsApiPublicConfig;
}

/**
 * Serialize a {@link EnsApiPublicConfig} object.
 *
 * @deprecated Use {@link serializeEnsApiPublicConfig} instead.
 */
export const serializeENSApiPublicConfig = serializeEnsApiPublicConfig;
