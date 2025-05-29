import { namehash } from "viem";
import { EVMCoinType, Node } from "./types";

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
export const ETH_COIN_TYPE: EVMCoinType = 60;
