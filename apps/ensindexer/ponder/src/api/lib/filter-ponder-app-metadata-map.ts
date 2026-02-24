import config from "@/config";

import type { ChainId } from "@ensnode/ponder-sdk";

/**
 * Filter a Ponder app metadata map
 *
 * Invariants:
 * - The input map must include entries for all indexed chains from
 *   ENSIndexer config.
 *
 * @param ponderAppMetadataMap The input map of Ponder app metadata.
 * @returns A filtered map including only entries for indexed chains from
 *          ENSIndexer config.
 * @throws Error if invariants are violated.
 */
export function filterPonderAppMetadataMap<PonderAppMetadataType>(
  ponderAppMetadataMap: Map<ChainId, PonderAppMetadataType>,
): Map<ChainId, PonderAppMetadataType> {
  const foundChainIds = new Set(ponderAppMetadataMap.keys());
  const indexedChainIds = config.indexedChainIds;

  // Invariant: ponderAppMetadataMap must cover all chains indexed by ENSIndexer
  // config and may include any chain that is not indexed.
  if (indexedChainIds.difference(foundChainIds).size > 0) {
    throw new Error(
      `Ponder App metadata must be available for all indexed chains. Indexed chain IDs from ENSIndexer config: ${Array.from(config.indexedChainIds).join(", ")}, Chain IDs in ponder metadata map: ${Array.from(ponderAppMetadataMap.keys()).join(", ")}`,
    );
  }

  const filteredPonderAppMetadata = ponderAppMetadataMap
    .entries()
    .filter(([chainId]) => indexedChainIds.has(chainId));

  return new Map(filteredPonderAppMetadata);
}
