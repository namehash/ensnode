import type { ChainId } from "../../shared";
import type {
  SerializedENSIndexerPublicConfig,
  SerializedIndexedChainIds,
} from "./serialized-types";
import type { ENSIndexerPublicConfig } from "./types";

/**
 * Serializes a {@link ChainConfig} object.
 */
export function serializeIndexedChainIds(indexedChainIds: Set<ChainId>): SerializedIndexedChainIds {
  return Array.from(indexedChainIds);
}
/**
 * Serialize a {@link ENSIndexerPublicConfig} object.
 */
export function serializeENSIndexerPublicConfig(
  config: ENSIndexerPublicConfig,
): SerializedENSIndexerPublicConfig {
  const {
    labelSet,
    indexedChainIds,
    databaseSchemaName,
    isSubgraphCompatible,
    namespace,
    plugins,
    versionInfo,
  } = config;

  return {
    labelSet,
    indexedChainIds: serializeIndexedChainIds(indexedChainIds),
    databaseSchemaName,
    isSubgraphCompatible,
    namespace,
    plugins,
    versionInfo,
  } satisfies SerializedENSIndexerPublicConfig;
}
