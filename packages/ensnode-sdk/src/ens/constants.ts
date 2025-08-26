import { namehash } from "viem";

import type { Node } from "./types";

export const ROOT_NODE: Node = namehash("");
export const ETH_NODE = namehash("eth");
export const BASENAMES_NODE = namehash("base.eth");
export const LINEANAMES_NODE = namehash("linea.eth");

/**
 * A set of nodes whose children are used for reverse resolution.
 *
 * Useful for identifying if a domain is used for reverse resolution.
 * See apps/ensindexer/src/handlers/Registry.ts for context.
 */
export const REVERSE_ROOT_NODES: Set<Node> = new Set([namehash("addr.reverse")]);
