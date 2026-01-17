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
import type { ChainId } from "@ensnode/ensnode-sdk";

import { ArbitrumIcon } from "./icons/ArbitrumIcon";
import { ArbitrumTestnetIcon } from "./icons/ArbitrumTestnetIcon";
import { BaseIcon } from "./icons/BaseIcon";
import { BaseTestnetIcon } from "./icons/BaseTestnetIcon";
import { EthereumIcon } from "./icons/EthereumIcon";
import { EthereumLocalIcon } from "./icons/EthereumLocalIcon";
import { EthereumTestnetIcon } from "./icons/EthereumTestnetIcon";
import { LineaIcon } from "./icons/LineaIcon";
import { LineaTestnetIcon } from "./icons/LineaTestnetIcon";
import { OptimismIcon } from "./icons/OptimismIcon";
import { OptimismTestnetIcon } from "./icons/OptimismTestnetIcon";
import { ScrollIcon } from "./icons/ScrollIcon";
import { ScrollTestnetIcon } from "./icons/ScrollTestnetIcon";
import { UnrecognizedChainIcon } from "./icons/UnrecognizedChainIcon";

export interface ChainIconProps {
  chainId: ChainId;
  width?: number;
  height?: number;
}

/**
 * Mapping of {@link ChainId} to chain icon.
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
