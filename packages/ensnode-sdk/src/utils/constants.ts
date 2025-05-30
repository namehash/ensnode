import { CoinType, EvmCoinType } from "@ensdomains/address-encoder";
import { namehash } from "viem";
import { Node } from "./types";

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
 * ENSIP-19 'EVM_BIT' representing the 'default' coinType for EVM chains in ENS.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/0c95e9b8d46c1344eff5d9ebe5fdb7657d9427d3/contracts/utils/ENSIP19.sol#L9
 */
export const EVM_BIT = (1 << 31) as EvmCoinType;
