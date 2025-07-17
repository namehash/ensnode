import { namehash } from "viem";
import type { CoinType, EvmCoinType, Node } from "./types";

export const ROOT_NODE: Node = namehash("");

/**
 * A set of nodes whose children are used for reverse resolution.
 *
 * Useful for identifying if a domain is used for reverse resolution.
 * See apps/ensindexer/src/handlers/Registry.ts for context.
 */
export const REVERSE_ROOT_NODES: Set<Node> = new Set([namehash("addr.reverse")]);

/**
 * The ETH coinType.
 *
 * @see https://docs.ens.domains/ensip/9
 */
export const ETH_COIN_TYPE: CoinType = 60;

/**
 * The 'default' chainId corresponding to the below {@link DEFAULT_EVM_COIN_TYPE} in the context of
 * ENSIP-19.
 *
 * @see https://docs.ens.domains/ensip/19
 */
export const DEFAULT_EVM_CHAIN_ID: number = 0;

/**
 * ENSIP-19 EVM CoinType representing the 'default' coinType for EVM chains in ENS.
 *
 * @see https://docs.ens.domains/ensip/19
 */
export const DEFAULT_EVM_COIN_TYPE = 0x8000_0000 as EvmCoinType;
