import {
  anvil,
  base,
  baseSepolia,
  holesky,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  sepolia,
} from "viem/chains";

interface ChainNameProps {
  chainId: number;
  className: string;
}

/**
 * Mapping of chain id to prettified chain name.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainNames = new Map<number, string>([
  [mainnet.id, "Ethereum"],
  [base.id, "Base"],
  [sepolia.id, "Ethereum Sepolia"],
  [optimism.id, "Optimism"],
  [linea.id, "Linea"],
  [holesky.id, "Ethereum Holesky"],
  [anvil.id, "Ethereum Local"],
  [baseSepolia.id, "Base Sepolia"],
  [lineaSepolia.id, "Linea Sepolia"],
]);

/**
 * Returns a prettified chain name for the provided chain ID.
 */
export function getChainName(chainId: number): string {
  const chainName = chainNames.get(chainId);

  if (!chainName) {
    throw new Error(`Chain ID "${chainId}" doesn't have an assigned name`);
  }

  return chainName;
}

/**
 * Renders a prettified chain name for the provided chain ID.
 */
export const ChainName = ({ chainId, className }: ChainNameProps) => (
  <p className={className}>{getChainName(chainId)}</p>
);
