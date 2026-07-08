import type { SerializedEnsApiPublicConfig } from "./serialized-types";
import type { EnsApiPublicConfig } from "./types";

/**
 * Serialize a {@link EnsApiPublicConfig} object.
 */
export function serializeEnsApiPublicConfig(
  config: EnsApiPublicConfig,
): SerializedEnsApiPublicConfig {
  return config;
}

/**
 * Serialize a {@link EnsApiPublicConfig} object.
 *
 * @deprecated Use {@link serializeEnsApiPublicConfig} instead.
 */
export const serializeENSApiPublicConfig = serializeEnsApiPublicConfig;
