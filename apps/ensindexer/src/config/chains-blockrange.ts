import { type ContractConfig, type ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import type {
  BlockrangeWithStartBlock,
  ChainId,
  ENSNamespaceId,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { getPlugin } from "@/plugins";

/**
 * Build a map of indexed chains to their corresponding blockranges,
 * based on the ENSIndexer configuration.
 *
 * @param namespace The ENS Namespace ID.
 * @param plugins The list of active plugin names.
 * @returns A map of chain IDs to their corresponding blockranges.
 */
export function buildChainsBlockrange(
  namespace: ENSNamespaceId,
  plugins: PluginName[],
): Map<ChainId, BlockrangeWithStartBlock> {
  const chainsBlockrange = new Map<ChainId, BlockrangeWithStartBlock>();

  const datasources = getENSNamespace(namespace) as ENSNamespace;

  for (const pluginName of plugins) {
    const datasourceNames = getPlugin(pluginName).requiredDatasourceNames;

    for (const datasourceName of datasourceNames) {
      const datasource = datasources[datasourceName];
      if (datasource) {
        const chainId = datasource.chain.id;

        for (const contract of Object.values(datasource.contracts)) {
          const currentChainBlockrange = chainsBlockrange.get(chainId);
          const chainBlockrange = buildChainBlockrange(contract, currentChainBlockrange);

          chainsBlockrange.set(chainId, chainBlockrange);
        }
      }
    }
  }

  return chainsBlockrange;
}

/**
 * Build a blockrange for a given contract, taking into account
 * the current blockrange for the contract's chain (if any).
 *
 * @param contract The contract configuration for which to build the blockrange.
 * @param currentBlockrange The current blockrange for the contract's chain, if any.
 * @returns The blockrange for the contract.
 */
function buildChainBlockrange(
  contract: ContractConfig,
  currentBlockrange?: BlockrangeWithStartBlock,
): BlockrangeWithStartBlock {
  const startBlock = currentBlockrange
    ? Math.min(currentBlockrange.startBlock, contract.startBlock)
    : contract.startBlock;

  const endBlock =
    currentBlockrange?.endBlock && contract.endBlock
      ? Math.max(currentBlockrange.endBlock, contract.endBlock)
      : contract.endBlock;

  return { startBlock, endBlock };
}
