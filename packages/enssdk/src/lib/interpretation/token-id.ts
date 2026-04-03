import { uint256ToHex32 } from "../helpers";
import type { LabelHash, Node } from "../types";

/**
 * Decodes a uint256-encoded-LabelHash (eg. from a tokenId) into a {@link LabelHash}.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
export const interpretTokenIdAsLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

/**
 * Decodes a uint256-encoded-Node (eg. from a tokenId) into a {@link Node}.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/wrapper/ERC1155Fuse.sol#L262
 */
export const interpretTokenIdAsNode = (tokenId: bigint): Node => uint256ToHex32(tokenId);
