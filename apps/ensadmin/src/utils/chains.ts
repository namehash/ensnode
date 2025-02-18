import { anvil, base, holesky, linea, mainnet, sepolia } from "viem/chains";

const chains = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [holesky.id]: holesky,
  [base.id]: base,
  [linea.id]: linea,
  [anvil.id]: anvil,
} as const;

export type SupportedChainId = keyof typeof chains;

export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId in chains;
}

export function getChainName(chainId: SupportedChainId): string {
  return chains[chainId as keyof typeof chains]?.name || `Chain ${chainId}`;
}

export function getBlockExplorerBlockUrl(
  chainId: SupportedChainId,
  blockNumber: number,
): string | null {
  if (chainId === anvil.id) return null;

  const chain = chains[chainId];

  if (!chain?.blockExplorers?.default?.url) return null;

  return `${chain.blockExplorers.default.url}/block/${blockNumber}`;
}
