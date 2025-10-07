import { ChainId } from "../../shared";
import { serializeUrl } from "../../shared/serialize";
import { SerializedENSIndexerPublicConfig, SerializedIndexedChainIds } from "./serialized-types";
import { ENSIndexerPublicConfig } from "./types";

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
    ensAdminUrl,
    ensNodePublicUrl,
    labelSet,
    indexedChainIds,
    databaseSchemaName,
    isSubgraphCompatible,
    namespace,
    plugins,
    versionInfo,
  } = config;

  return {
    ensAdminUrl: serializeUrl(ensAdminUrl),
    ensNodePublicUrl: serializeUrl(ensNodePublicUrl),
    labelSet,
    indexedChainIds: serializeIndexedChainIds(indexedChainIds),
    databaseSchemaName,
    isSubgraphCompatible,
    namespace,
    plugins,
    versionInfo,
  } satisfies SerializedENSIndexerPublicConfig;
}
