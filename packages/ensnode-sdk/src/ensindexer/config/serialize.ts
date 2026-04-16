import type { ChainId } from "enssdk";

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
    ensIndexerSchemaName,
    ensRainbowPublicConfig,
    indexedChainIds,
    isSubgraphCompatible,
    labelSet,
    namespace,
    plugins,
    versionInfo,
  } = config;

  return {
    ensIndexerSchemaName,
    ensRainbowPublicConfig,
    indexedChainIds: serializeIndexedChainIds(indexedChainIds),
    isSubgraphCompatible,
    labelSet,
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
