export function isChainIndexingActive(chainId: number) {
  if (!process.env.ENS_DEPLOYMENT_CHAIN_ID) {
    console.warn("ENS_DEPLOYMENT_CHAIN_ID is not set");
    return false;
  }

  return parseInt(process.env.ENS_DEPLOYMENT_CHAIN_ID, 10) === chainId;
}

export function createNs<ChainId extends number>(chainId: ChainId) {
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
