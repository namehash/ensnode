import { type DatasourceName, maybeGetDatasource } from "@ensnode/datasources";
import type {
  BlockNumber,
  BlockrangeWithStartBlock,
  ChainId,
  ENSNamespaceId,
  PluginName,
} from "@ensnode/ensnode-sdk";

/**
 * Build a map of indexed blockranges for each indexed chain,
 * based on the ENSIndexer configuration.
 *
 * Useful for presenting a clear view of the indexed blockranges
 * across chains.
 */
export function buildIndexedBlockranges(
  namespace: ENSNamespaceId,
  pluginsRequiredDatasourceNames: Map<PluginName, DatasourceName[]>,
): Map<ChainId, BlockrangeWithStartBlock> {
  const indexedBlockranges = new Map<ChainId, BlockrangeWithStartBlock>();

  for (const [pluginName, requiredDatasourceNames] of pluginsRequiredDatasourceNames) {
    for (const requiredDatasourceName of requiredDatasourceNames) {
      const requiredDatasource = maybeGetDatasource(namespace, requiredDatasourceName);

      if (!requiredDatasource) {
        throw new Error(
          `Datasource ${requiredDatasourceName} required by plugin ${pluginName} is not defined in namespace ${namespace}.`,
        );
      }

      const chainId = requiredDatasource.chain.id;

      for (const contract of Object.values(requiredDatasource.contracts)) {
        const currentChainIndexedBlockrange = indexedBlockranges.get(chainId);
        const indexedBlockrange = buildIndexedBlockrange(contract, currentChainIndexedBlockrange);

        indexedBlockranges.set(chainId, indexedBlockrange);
      }
    }
  }

  return indexedBlockranges;
}

/**
 * Build a blockrange for a given contract, taking into account
 * the current blockrange for the contract's chain (if any).
 *
 * @param contractIndexedBlockrange The indexed blockrange for the contract based on its config.
 * @param currentChainIndexedBlockrange The current blockrange for the contract's chain, if any.
 * @returns The updated indexed blockrange for the contract's chain.
 */
function buildIndexedBlockrange(
  contractIndexedBlockrange: BlockrangeWithStartBlock,
  currentChainIndexedBlockrange?: BlockrangeWithStartBlock,
): BlockrangeWithStartBlock {
  let startBlock: BlockNumber;

  if (currentChainIndexedBlockrange !== undefined) {
    startBlock = Math.min(
      currentChainIndexedBlockrange.startBlock,
      contractIndexedBlockrange.startBlock,
    );
  } else {
    startBlock = contractIndexedBlockrange.startBlock;
  }

  let endBlock: BlockNumber | undefined;

  if (
    currentChainIndexedBlockrange?.endBlock !== undefined &&
    contractIndexedBlockrange.endBlock !== undefined
  ) {
    endBlock = Math.max(currentChainIndexedBlockrange.endBlock, contractIndexedBlockrange.endBlock);
  } else {
    endBlock = currentChainIndexedBlockrange?.endBlock ?? contractIndexedBlockrange.endBlock;
  }

  return { startBlock, endBlock };
}
