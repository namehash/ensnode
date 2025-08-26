import { ArbitrumIcon } from "@/components/icons/ArbitrumIcon";
import { ArbitrumTestnetIcon } from "@/components/icons/ArbitrumTestnetIcon";
import { BaseTestnetIcon } from "@/components/icons/BaseTestnetIcon";
import { LineaTestnetIcon } from "@/components/icons/LineaTestnetIcon";
import { OptimismTestnetIcon } from "@/components/icons/OptimismTestnetIcon";
import { ScrollIcon } from "@/components/icons/ScrollIcon";
import { ScrollTestnetIcon } from "@/components/icons/ScrollTestnetIcon";
import { ensTestEnv } from "@/lib/chains";

import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  holesky,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
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
  [mainnet.id, <EthereumIcon width={20} height={20} />],
  [base.id, <BaseIcon width={20} height={20} />],
  [sepolia.id, <EthereumTestnetIcon width={20} height={20} />],
  [optimism.id, <OptimismIcon width={20} height={20} />],
  [optimismSepolia.id, <OptimismTestnetIcon width={20} height={20} />],
  [linea.id, <LineaIcon width={20} height={20} />],
  [holesky.id, <EthereumTestnetIcon width={20} height={20} />],
  [ensTestEnv.id, <EthereumLocalIcon width={20} height={20} />],
  [baseSepolia.id, <BaseTestnetIcon width={20} height={20} />],
  [lineaSepolia.id, <LineaTestnetIcon width={20} height={20} />],
  [arbitrum.id, <ArbitrumIcon width={20} height={20} />],
  [arbitrumSepolia.id, <ArbitrumTestnetIcon width={20} height={20} />],
  [scroll.id, <ScrollIcon width={20} height={20} />],
  [scrollSepolia.id, <ScrollTestnetIcon width={20} height={20} />],
]);

/**
 * Renders an icon for the provided chain ID.
 */
export function ChainIcon({ chainId }: ChainIconProps) {
  return chainIcons.get(chainId) || <UnrecognizedIcon width={20} height={20} />;
}
