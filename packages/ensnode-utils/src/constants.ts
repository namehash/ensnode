import { namehash } from "viem";
import { Node } from "./types";

export const ROOT_NODE: Node = namehash("");

// a set of know reverse root nodes, useful for determining if an unknown labelhash is likely to
// be the owner of a domain setting their reverse record
export const REVERSE_ROOT_NODES: Set<Node> = new Set([namehash("addr.reverse")]);
