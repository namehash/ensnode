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
    ensRainbowUrl,
    indexedChainIds,
    databaseSchemaName,
    experimentalResolution,
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
    ensRainbowUrl: serializeUrl(ensRainbowUrl),
    indexedChainIds: serializeIndexedChainIds(indexedChainIds),
    databaseSchemaName,
    experimentalResolution,
    healReverseAddresses,
    indexAdditionalResolverRecords,
    isSubgraphCompatible,
    namespace,
    plugins,
    dependencyInfo,
  } satisfies SerializedENSIndexerPublicConfig;
}
