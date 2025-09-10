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
}

/**
 * Mapping of chain id to chain icon.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainIcons = new Map<number, React.ReactNode>([
  // mainnet
  [mainnet.id, <EthereumIcon width={20} height={20} />],
  [base.id, <BaseIcon width={20} height={20} />],
  [linea.id, <LineaIcon width={20} height={20} />],
  [optimism.id, <OptimismIcon width={20} height={20} />],
  [arbitrum.id, <ArbitrumIcon width={20} height={20} />],
  [scroll.id, <ScrollIcon width={20} height={20} />],

  // sepolia
  [sepolia.id, <EthereumTestnetIcon width={20} height={20} />],
  [baseSepolia.id, <BaseTestnetIcon width={20} height={20} />],
  [lineaSepolia.id, <LineaTestnetIcon width={20} height={20} />],
  [optimismSepolia.id, <OptimismTestnetIcon width={20} height={20} />],
  [arbitrumSepolia.id, <ArbitrumTestnetIcon width={20} height={20} />],
  [scrollSepolia.id, <ScrollTestnetIcon width={20} height={20} />],

  // holesky
  [holesky.id, <EthereumTestnetIcon width={20} height={20} />],

  // ens-test-env
  [ensTestEnvL1Chain.id, <EthereumLocalIcon width={20} height={20} />],
]);

/**
 * Renders an icon for the provided chain ID.
 */
export function ChainIcon({ chainId }: ChainIconProps) {
  return chainIcons.get(chainId) || <UnrecognizedChainIcon width={20} height={20} />;
}
