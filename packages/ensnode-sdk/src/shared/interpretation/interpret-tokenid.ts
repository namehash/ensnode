import { type LabelHash, type Node, uint256ToHex32 } from "../../ens";

/**
 * Decodes a uint256-encoded-LabelHash (eg. from a tokenId) into a {@link LabelHash}.
 *
 * Remember that contracts that operate in the context of a Managed Name frequently store and operate
 * over _LabelHashes_ that represent a direct subname of a Managed Name. These contracts also frequently
 * implement ERC721 or ERC1155 to represent ownership of these Names. As such, to construct the
 * ERC721/ERC1155 tokenId, they may encode the direct subnames's LabelHash as a uint256.
 *
 * This is true for the ENSv1 BaseRegistrar, RegistrarControllers, as well as any
 * contracts forked from it (which includes Basenames' and Lineanames' implementations).
 *
 * So, in order to turn the tokenId into a LabelHash, we perform the opposite operation, decoding
 * from a uint256 into a Hex (of size 32) and cast it as our semantic {@link LabelHash} type.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 * @see https://github.com/base/basenames/blob/1b5c1ad/src/L2/RegistrarController.sol#L488
 * @see https://github.com/Consensys/linea-ens/blob/3a4f02f/packages/linea-ens-contracts/contracts/ethregistrar/ETHRegistrarController.sol#L447
 */
export const interpretTokenIdAsLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);

/**
 * Decodes a uint256-encoded-Node (eg. from a tokenId) into a {@link Node}.
 *
 * Contracts in the ENSv1 ecosystem frequently implement ERC721 or ERC1155 to represent
 * ownership of a Domain. As such, to construct the ERC721/ERC1155 tokenId, they may encode the
 * domain's {@link Node} as a uint256.
 *
 * This is true for the ENSv1 NameWrapper, as well as any contracts forked from it (which includes
 * Lineanames' implementation).
 *
 * So, in order to turn the tokenId into a Node, we perform the opposite operation, decoding
 * from a uint256 into a Hex (of size 32) and cast it as our semantic {@link Node} type.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/wrapper/ERC1155Fuse.sol#L262
 */
export const interpretTokenIdAsNode = (tokenId: bigint): Node => uint256ToHex32(tokenId);
