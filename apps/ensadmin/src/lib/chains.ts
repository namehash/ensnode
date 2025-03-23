import { type ENSDeploymentChain } from "@ensnode/ens-deployments";
import { anvil, base, holesky, linea, mainnet, sepolia } from "viem/chains";

const chains = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [holesky.id]: holesky,
  [base.id]: base,
  [linea.id]: linea,
} as const;

export function getChainName(chainId: number): string {
  return chains[chainId as keyof typeof chains]?.name || `Chain ${chainId}`;
}

export function getBlockExplorerUrl(chainId: number, blockNumber: number): string | null {
  const chain = chains[chainId as keyof typeof chains];
  if (!chain?.blockExplorers?.default?.url) return null;
  return `${chain.blockExplorers.default.url}/block/${blockNumber}`;
}

/**
 * Parse ENS Deployment Chain into Chain ID.
 */
export function parseEnsDeploymentChainIntoChainId(ensDeploymentChain: ENSDeploymentChain): number {
  switch (ensDeploymentChain) {
    case "mainnet":
      return mainnet.id;
    case "sepolia":
      return sepolia.id;
    case "holesky":
      return holesky.id;
    case "ens-test-env":
      return anvil.id;
  }
}
