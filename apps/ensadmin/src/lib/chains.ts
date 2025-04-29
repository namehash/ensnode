import { type Chain, base, holesky, linea, mainnet, optimism, sepolia } from "viem/chains";

const chains = [mainnet, sepolia, holesky, optimism, base, linea] satisfies Array<Chain>;

export function getChainName(chainId: number): string {
  const chain = chains.find((chain) => chain.id === chainId);

  if (!chain) {
    throw new Error(`Chain ${chainId} is not supported`);
  }

  return chain.name;
}
