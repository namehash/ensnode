import { namehash, zeroHash } from "viem";

import type { Node } from "./types";

export const ROOT_NODE: Node = namehash("");
export const ETH_NODE: Node = namehash("eth");
export const BASENAMES_NODE: Node = namehash("base.eth");
export const LINEANAMES_NODE: Node = namehash("linea.eth");
export const ADDR_REVERSE_NODE: Node = namehash("addr.reverse");

/**
 * NODE_ANY is a placeholder Node used in the context of DedicatedResolvers — IResolver events are
 * emitted with NODE_ANY as the `node` for which the records are issued, but the DedicatedResolver
 * returns those records regardless of the name used for record resolution.
 */
export const NODE_ANY: Node = zeroHash;
