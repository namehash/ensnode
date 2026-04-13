import { namehashInterpretedName } from "./namehash";
import type { EACResource, InterpretedName, Node } from "./types";

/**
 * Name for the ENS Root
 *
 * @dev manually cast to InterpretedName to avoid circular import
 */
export const ENS_ROOT_NAME = "" as InterpretedName;

/**
 * The {@link Node} that identifies the ENS Root Name ("").
 */
export const ENS_ROOT_NODE: Node = namehashInterpretedName(ENS_ROOT_NAME);

/**
 * The {@link Node} that identifies the ETH Name ("eth").
 *
 * @dev manually cast to InterpretedName to avoid circular import
 */
export const ETH_NODE: Node = namehashInterpretedName("eth" as InterpretedName);

/**
 * The {@link Node} that identifies the addr.reverse Name ("addr.reverse").
 *
 * @dev manually cast to InterpretedName to avoid circular import
 */
export const ADDR_REVERSE_NODE: Node = namehashInterpretedName("addr.reverse" as InterpretedName);

/**
 * ROOT_RESOURCE represents the 'root' resource in an EnhancedAccessControl contract.
 */
export const ROOT_RESOURCE: EACResource = 0n;
