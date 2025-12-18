import { serializeENSIndexerPublicConfig } from "../../ensindexer/config/serialize";
import type { SerializedENSApiPublicConfig } from "./serialized-types";
import type { ENSApiPublicConfig } from "./types";

/**
 * Serialize a {@link ENSApiPublicConfig} object.
 */
export function serializeENSApiPublicConfig(
  config: ENSApiPublicConfig,
): SerializedENSApiPublicConfig {
  const { version, theGraphFallback, ensIndexerPublicConfig } = config;

  return {
    version,
    theGraphFallback,
    ensIndexerPublicConfig: serializeENSIndexerPublicConfig(ensIndexerPublicConfig),
  } satisfies SerializedENSApiPublicConfig;
}
