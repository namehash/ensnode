import { ArbitrumIcon } from "@/components/icons/chains/ArbitrumIcon";
import { ArbitrumTestnetIcon } from "@/components/icons/chains/ArbitrumTestnetIcon";
import { BaseIcon } from "@/components/icons/chains/BaseIcon";
import { BaseTestnetIcon } from "@/components/icons/chains/BaseTestnetIcon";
import { EthereumIcon } from "@/components/icons/chains/EthereumIcon";
import { EthereumLocalIcon } from "@/components/icons/chains/EthereumLocalIcon";
import { EthereumTestnetIcon } from "@/components/icons/chains/EthereumTestnetIcon";
import { LineaIcon } from "@/components/icons/chains/LineaIcon";
import { LineaTestnetIcon } from "@/components/icons/chains/LineaTestnetIcon";
import { OptimismIcon } from "@/components/icons/chains/OptimismIcon";
import { OptimismTestnetIcon } from "@/components/icons/chains/OptimismTestnetIcon";
import { ScrollIcon } from "@/components/icons/chains/ScrollIcon";
import { ScrollTestnetIcon } from "@/components/icons/chains/ScrollTestnetIcon";
import { UnrecognizedChainIcon } from "@/components/icons/chains/UnrecognizedChainIcon";
import { ensTestEnvL1Chain } from "@ensnode/datasources";
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

  // holesky
  [holesky.id, EthereumTestnetIcon],

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
