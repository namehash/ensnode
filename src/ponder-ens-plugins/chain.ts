
// TODO: change the chainId to the root path (i.e. ("base.eth"))
export function isChainIndexingActive(rootPath: `${string}.eth`) {
  if (!process.env.INDEX_ENS_ROOT_NODE) {
    console.warn("INDEX_ENS_ROOT_NODE is not set");
    return false;
  }

  return process.env.INDEX_ENS_ROOT_NODE === rootPath;
}

// TODO: change the chainId to the root node value (i.e. namehash("base.eth"))
export function createNs<ChainId extends number>(chainId: ChainId) {
  /** Creates a name-spaced contract name */
  return function ns<ContractName extends string>(
    contractName: ContractName,
  ): NsReturnType<ContractName, ChainId> {
    return `Chain${chainId}_${contractName}` as NsReturnType<ContractName, ChainId>;
  };
}

export type NsReturnType<
  ContractName extends string,
  ChainId extends number,
> = `Chain${ChainId}_${ContractName}`;
