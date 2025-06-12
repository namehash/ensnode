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

//TODO: placement of the file could change
//TODO: decide whether we prefer to wrap the mapping with a component (like currently) or a function - getChainName per se

export interface ChainNameProps {
  chainId: number;
  className: string;
}

/**
 * Mapping of chain's id to its prettified name.
 * Based on standards organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainNames = new Map<number, string>([
  //TODO: these prettified versions of names will probably change to better accomoadate our needs
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
 * Renders a prettified chain name based on the provided chain ID.
 */
export function ChainName({ chainId, className }: ChainNameProps) {
  // TODO: decide on using Map object vs. switch case (dependent on developement plans)
  if (!chainNames.has(chainId)) {
    throw new Error(`Chain ID "${chainId}" doesn't have an assigned icon`);
  }

  return <p className={className}>{chainNames.get(chainId)}</p>;
}
