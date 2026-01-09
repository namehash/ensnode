import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
  sepolia,
} from "viem/chains";

import { ensTestEnvL1Chain } from "@ensnode/datasources";

import { ArbitrumIcon } from "./icons/ArbitrumIcon.tsx";
import { ArbitrumTestnetIcon } from "./icons/ArbitrumTestnetIcon.tsx";
import { BaseIcon } from "./icons/BaseIcon.tsx";
import { BaseTestnetIcon } from "./icons/BaseTestnetIcon.tsx";
import { EthereumIcon } from "./icons/EthereumIcon.tsx";
import { EthereumLocalIcon } from "./icons/EthereumLocalIcon.tsx";
import { EthereumTestnetIcon } from "./icons/EthereumTestnetIcon.tsx";
import { LineaIcon } from "./icons/LineaIcon.tsx";
import { LineaTestnetIcon } from "./icons/LineaTestnetIcon.tsx";
import { OptimismIcon } from "./icons/OptimismIcon.tsx";
import { OptimismTestnetIcon } from "./icons/OptimismTestnetIcon.tsx";
import { ScrollIcon } from "./icons/ScrollIcon.tsx";
import { ScrollTestnetIcon } from "./icons/ScrollTestnetIcon.tsx";
import { UnrecognizedChainIcon } from "./icons/UnrecognizedChainIcon.tsx";

export interface ChainIconProps {
  chainId: number;
  width?: number;
  height?: number;
}

/**
 * Mapping of chain id to chain icon.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainIcons = new Map<number, React.ComponentType<React.SVGProps<SVGSVGElement>>>([
  // mainnet
  [mainnet.id, EthereumIcon],
  [base.id, BaseIcon],
  [linea.id, LineaIcon],
  [optimism.id, OptimismIcon],
  [arbitrum.id, ArbitrumIcon],
  [scroll.id, ScrollIcon],

  // sepolia
  [sepolia.id, EthereumTestnetIcon],
  [baseSepolia.id, BaseTestnetIcon],
  [lineaSepolia.id, LineaTestnetIcon],
  [optimismSepolia.id, OptimismTestnetIcon],
  [arbitrumSepolia.id, ArbitrumTestnetIcon],
  [scrollSepolia.id, ScrollTestnetIcon],

  // ens-test-env
  [ensTestEnvL1Chain.id, EthereumLocalIcon],
]);

/**
 * Renders an icon for the provided chain ID.
 */
export function ChainIcon({ chainId, width = 20, height = 20 }: ChainIconProps) {
  const Icon = chainIcons.get(chainId) || UnrecognizedChainIcon;
  return <Icon width={width} height={height} />;
}
