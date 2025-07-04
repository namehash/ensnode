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

export interface ChainNameProps {
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
 * Renders a prettified chain name for the provided chain ID.
 */
export function ChainName({ chainId, className }: ChainNameProps) {
  if (!chainNames.has(chainId)) {
    throw new Error(`Chain ID "${chainId}" doesn't have an assigned name`);
  }

  return <p className={className}>{chainNames.get(chainId)}</p>;
}
