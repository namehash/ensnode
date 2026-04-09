import { asInterpretedName } from "./interpreted-names-and-labels";
import { namehashInterpretedName } from "./namehash";
import type { Node } from "./types";

export const ROOT_NODE: Node = namehashInterpretedName(asInterpretedName(""));
export const ETH_NODE: Node = namehashInterpretedName(asInterpretedName("eth"));
export const ADDR_REVERSE_NODE: Node = namehashInterpretedName(asInterpretedName("addr.reverse"));

/**
 * ROOT_RESOURCE represents the 'root' resource in an EnhancedAccessControl contract.
 */
export const ROOT_RESOURCE = 0n;
