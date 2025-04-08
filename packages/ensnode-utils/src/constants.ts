import { namehash } from "viem";
import { Node } from "./types";

export const ROOT_NODE: Node = namehash("");

/**
 * A set of nodes whose children are used for reverse resolution.
 *
 * Useful for filtering new domains by whether they're a reverse node for a specific address.
 * See apps/ensindexer/src/handlers/Registry.ts for context.
 */
export const REVERSE_ROOT_NODES: Set<Node> = new Set([namehash("addr.reverse")]);
