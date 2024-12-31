export function isChainIndexingActive(chainId: number) {
  return process.env.CHAINS_TO_INDEX?.split(",")
    .map((maybeChainId) => parseInt(maybeChainId, 10))
    .includes(chainId);
}
