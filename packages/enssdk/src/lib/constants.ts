import { asInterpretedName } from "./interpreted-names-and-labels";
import { namehashInterpretedName } from "./namehash";
import type { EACResource, Node } from "./types";

/**
 * Name for the ENS Root
 */
export const ENS_ROOT_NAME = asInterpretedName("");

/**
 * The {@link Node} that identifies the ENS Root Name ("").
 */
export const ENS_ROOT_NODE: Node = namehashInterpretedName(asInterpretedName(""));

/**
 * The {@link Node} that identifies the ETH Name ("eth").
 */
export const ETH_NODE: Node = namehashInterpretedName(asInterpretedName("eth"));

/**
 * The {@link Node} that identifies the addr.reverse Name ("addr.reverse").
 */
export const ADDR_REVERSE_NODE: Node = namehashInterpretedName(asInterpretedName("addr.reverse"));

/**
 * ROOT_RESOURCE represents the 'root' resource in an EnhancedAccessControl contract.
 */
export const ROOT_RESOURCE: EACResource = 0n;
