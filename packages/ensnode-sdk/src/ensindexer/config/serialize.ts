import type { ChainId } from "../../shared/types";
import type {
  SerializedEnsIndexerPublicConfig,
  SerializedIndexedChainIds,
} from "./serialized-types";
import type { EnsIndexerPublicConfig } from "./types";

/**
 * Serializes a {@link ChainConfig} object.
 */
export function serializeIndexedChainIds(indexedChainIds: Set<ChainId>): SerializedIndexedChainIds {
  return Array.from(indexedChainIds);
}

/**
 * Serialize a {@link EnsIndexerPublicConfig} object.
 */
export function serializeEnsIndexerPublicConfig(
  config: EnsIndexerPublicConfig,
): SerializedEnsIndexerPublicConfig {
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
  } satisfies SerializedEnsIndexerPublicConfig;
}

/**
 * Serialize a {@link EnsIndexerPublicConfig} object.
 *
 * @deprecated Use {@link serializeEnsIndexerPublicConfig} instead.
 */
export const serializeENSIndexerPublicConfig = serializeEnsIndexerPublicConfig;
