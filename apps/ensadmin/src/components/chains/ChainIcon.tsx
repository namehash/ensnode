import { BaseTestnetIcon } from "@/components/icons/BaseTestnetIcon";
import { LineaTestnetIcon } from "@/components/icons/LineaTestnetIcon";
import { ensTestEnv } from "@/lib/chains";

import {
  base,
  baseSepolia,
  holesky,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  sepolia,
} from "viem/chains";
import { BaseIcon } from "../icons/BaseIcon";
import { EthereumIcon } from "../icons/EthereumIcon";
import { EthereumLocalIcon } from "../icons/EthereumLocalIcon";
import { EthereumTestnetIcon } from "../icons/EthereumTestnetIcon";
import { LineaIcon } from "../icons/LineaIcon";
import { OptimismIcon } from "../icons/OptimismIcon";
import { UnrecognizedIcon } from "../icons/UnrecognizedIcon";

export interface ChainIconProps {
  chainId: number;
}

/**
 * Mapping of chain id to chain icon.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainIcons = new Map<number, React.ReactNode>([
  [mainnet.id, <EthereumIcon width={18} height={18} />],
  [base.id, <BaseIcon width={18} height={18} />],
  [sepolia.id, <EthereumTestnetIcon width={18} height={18} />],
  [optimism.id, <OptimismIcon width={18} height={18} />],
  [linea.id, <LineaIcon width={18} height={18} />],
  [holesky.id, <EthereumTestnetIcon width={18} height={18} />],
  [ensTestEnv.id, <EthereumLocalIcon width={18} height={18} />],
  [baseSepolia.id, <BaseTestnetIcon width={18} height={18} />],
  [lineaSepolia.id, <LineaTestnetIcon width={18} height={18} />],
]);

/**
 * Renders an icon for the provided chain ID.
 */
export function ChainIcon({ chainId }: ChainIconProps) {
  return chainIcons.get(chainId) || <UnrecognizedIcon width={18} height={18} />;
}
