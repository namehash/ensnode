import { ChainId } from "@ensnode/datasources";
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
    indexedChainIds,
    databaseSchemaName,
    healReverseAddresses,
    indexAdditionalResolverRecords,
    isSubgraphCompatible,
    namespace,
    plugins,
    dependencyInfo,
  } = config;

  return {
    ensAdminUrl: serializeUrl(ensAdminUrl),
    ensNodePublicUrl: serializeUrl(ensNodePublicUrl),
    indexedChainIds: serializeIndexedChainIds(indexedChainIds),
    databaseSchemaName,
    healReverseAddresses,
    indexAdditionalResolverRecords,
    isSubgraphCompatible,
    namespace,
    plugins,
    dependencyInfo,
  } satisfies SerializedENSIndexerPublicConfig;
}
