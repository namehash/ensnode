import { serializeENSIndexerPublicConfig } from "../../ensindexer";
import type { SerializedENSApiPublicConfig } from "./serialized-types";
import type { ENSApiPublicConfig } from "./types";

/**
 * Serialize a {@link ENSApiPublicConfig} object.
 */
export function serializeENSApiPublicConfig(
  config: ENSApiPublicConfig,
): SerializedENSApiPublicConfig {
  const { version, ensIndexerPublicConfig } = config;

  return {
    version,
    ensIndexerPublicConfig: serializeENSIndexerPublicConfig(ensIndexerPublicConfig),
  } satisfies SerializedENSApiPublicConfig;
}
