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
