import { mainnet, sepolia, holesky, anvil, optimism, base, linea } from "viem/chains";
import { BaseIcon } from "./BaseIcon";
import { EthereumIcon } from "./EthereumIcon";
import { EthereumLocalIcon } from "./EthereumLocalIcon";
import { EthereumTestnetIcon } from "./EthereumTestnetIcon";
import { LineaIcon } from "./LineaIcon";
import { OptimismIcon } from "./OptimismIcon";

export interface ChainIconProps {
    chainId: number;
}

/**
 * Mapping of chain's id to its icon.
 * Based on standards organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainIcons = new Map<number, React.ReactNode>([
    [mainnet.id, <EthereumIcon width={18} height={18} />],
    [base.id, <BaseIcon width={18} height={18} />],
    [sepolia.id, <EthereumTestnetIcon width={18} height={18} />],
    [optimism.id, <OptimismIcon width={18} height={18} />],
    [linea.id, <LineaIcon width={18} height={18} />],
    [holesky.id, <EthereumTestnetIcon width={18} height={18} />],
    [anvil.id, <EthereumLocalIcon width={18} height={18} />],
]);

/**
 * Renders an icon based on the provided chain ID.
 */
export function ChainIcon({ chainId }: ChainIconProps) {
    // TODO: decide on using Map object vs. switch case (dependent on developement plans)
    if (!chainIcons.has(chainId)) {
        return <></>;
        //TODO: decide what to do with unknown chain IDs
        // return empty fragment or perhaps
        // throw new Error(`Chain ID "${chainId}" doesn't have an assigned icon`);
    }

    return chainIcons.get(chainId);
}