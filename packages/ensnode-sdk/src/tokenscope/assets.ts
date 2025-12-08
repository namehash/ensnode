import { type Address, type Hex, isAddressEqual, zeroAddress } from "viem";

import type { Node } from "../ens";
import { type AssetId, type ChainId, serializeAssetId } from "../shared";

/**
 * A globally unique reference to an NFT tokenizing the ownership of a domain.
 */
export interface DomainAssetId extends AssetId {
  /**
   * The namehash (node) of the domain who's ownership is tokenized by
   * this `AssetId`.
   */
  domainId: Node;
}

/**
 * An enum representing the mint status of a DomainAssetId.
 *
 * After we index a NFT we never delete it from our index. Instead, when an
 * indexed NFT is burned onchain we retain its record and update its mint
 * status as `burned`. If a NFT is minted again after it is burned its mint
 * status is updated to `minted`.
 */
export const NFTMintStatuses = {
  Minted: "minted",
  Burned: "burned",
} as const;

export type NFTMintStatus = (typeof NFTMintStatuses)[keyof typeof NFTMintStatuses];

/**
 * Metadata about a NFT transfer event.
 *
 * This metadata can be used for building more helpful messages when processing
 * NFT transfer events.
 */
export interface NFTTransferEventMetadata {
  chainId: ChainId;
  blockNumber: bigint;
  transactionHash: Hex;
  eventHandlerName: string;
  nft: DomainAssetId;
}

export const formatNFTTransferEventMetadata = (metadata: NFTTransferEventMetadata): string => {
  const serializedAssetId = serializeAssetId(metadata.nft);

  return [
    `Event: ${metadata.eventHandlerName}`,
    `Chain ID: ${metadata.chainId}`,
    `Block Number: ${metadata.blockNumber}`,
    `Transaction Hash: ${metadata.transactionHash}`,
    `NFT: ${serializedAssetId}`,
  ]
    .map((line) => ` - ${line}`)
    .join("\n");
};

/**
 * An enum representing the type of transfer that has occurred to a DomainAssetId.
 */
export const NFTTransferTypes = {
  /**
   * Initial transfer from zeroAddress to a non-zeroAddress
   * Can happen at most once to a NFT AssetId
   *
   * Invariants:
   * - NFT is not indexed and therefore has no previous mint status or owner
   * - new NFT mint status is `minted`
   * - new NFT owner is a non-zeroAddress
   */
  Mint: "mint",

  /**
   * Subsequent transfer from zeroAddress to a non-zeroAddress
   * Can happen any number of times to a NFT AssetId as it passes in a cycle from
   * mint -> burn -> remint -> burn -> remint -> ...
   *
   * Invariants:
   * - NFT is indexed
   * - previous NFT mint status was `burned`
   * - previous NFT owner is the zeroAddress
   * - new NFT mint status is `minted`
   * - new NFT owner is a non-zeroAddress
   */
  Remint: "remint",

  /**
   * Special transfer type for improperly implemented NFT contracts that allow a NFT
   * that is currently minted to be reminted before an intermediate burn.
   *
   * Transfer from zeroAddress to non-zeroAddress for an indexed NFT where the
   * previously indexed nft had status `minted` with a non-zeroAddress owner.
   *
   * Invariants:
   * - NFT is indexed
   * - previous NFT mint status was `minted`
   * - previous NFT owner was a non-zeroAddress
   * - new NFT mint status is `minted`
   * - new NFT owner is a non-zeroAddress
   */
  MintedRemint: "minted-remint",

  /**
   * Transfer from a non-zeroAddress to zeroAddress
   *
   * Invariants:
   * - NFT is indexed
   * - previous NFT mint status was `minted`
   * - previous NFT owner is a non-zeroAddress
   * - new NFT mint status is `burned`
   * - new NFT owner is the zeroAddress
   */
  Burn: "burn",

  /**
   * Transfer from a non-zeroAddress to a distinct non-zeroAddress
   *
   * Invariants:
   * - NFT is indexed
   * - previous and new NFT mint status is `minted`
   * - previous and new NFT owner are distinct non-zeroAddress
   */
  Transfer: "transfer",

  /**
   * Transfer from a non-zeroAddress to the same non-zeroAddress
   *
   * Invariants:
   * - NFT is indexed
   * - previous and new NFT mint status is `minted`
   * - previous and new NFT owner are equivalent non-zeroAddress
   */
  SelfTransfer: "self-transfer",

  /**
   * Transfer from zeroAddress to zeroAddress for an indexed NFT
   *
   * Invariants:
   * - NFT is indexed
   * - previous and new NFT mint status is `burned`
   * - previous and new NFT owner are zeroAddress
   */
  RemintBurn: "remint-burn",

  /**
   * Special transfer type for improperly implemented NFT contracts that allow a NFT
   * that is currently minted to be reminted again before an intermediate burn.
   *
   * Transfer from zeroAddress to zeroAddress for an indexed NFT where the
   * previously indexed nft had status `minted` with a non-zeroAddress owner.
   *
   * Invariants:
   * - NFT is indexed
   * - previous NFT mint status was `minted`
   * - previous NFT owner was a non-zeroAddress
   * - new NFT mint status is `burned`
   * - new NFT owner is the zeroAddress
   */
  MintedRemintBurn: "minted-remint-burn",

  /**
   * Transfer from zeroAddress to zeroAddress for an unindexed NFT
   *
   * Invariants:
   * - NFT is not indexed and therefore has no previous mint status or owner
   * - NFT should remain unindexed and without any mint status or owner
   */
  MintBurn: "mint-burn",
} as const;

export type NFTTransferType = (typeof NFTTransferTypes)[keyof typeof NFTTransferTypes];

export const getNFTTransferType = (
  from: Address,
  to: Address,
  allowMintedRemint: boolean,
  metadata: NFTTransferEventMetadata,
  currentlyIndexedOwner?: Address,
): NFTTransferType => {
  const isIndexed = currentlyIndexedOwner !== undefined;
  const isIndexedAsMinted = isIndexed && !isAddressEqual(currentlyIndexedOwner, zeroAddress);

  // a transfer from the zeroAddress to a non-zeroAddress represents minting
  const isMint = isAddressEqual(from, zeroAddress);

  // a transfer from a non-zeroAddress to the zeroAddress represents burning
  const isBurn = isAddressEqual(to, zeroAddress);

  // it's possible to transfer to and from the same address
  const isSelfTransfer = isAddressEqual(from, to);

  if (isIndexed && !isAddressEqual(currentlyIndexedOwner, from)) {
    if (isMint && allowMintedRemint) {
      // special case to allow minted remint from improperly implemented NFT contracts
    } else {
      throw new Error(
        `Error: Sending from ${from} conflicts with currently indexed owner ${currentlyIndexedOwner}.\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    }
  }

  if (isSelfTransfer) {
    if (isMint) {
      // a self-transfer to and from the zeroAddress represents either mint-burn, remint-burn,
      // or minted-remint-burn
      if (!isIndexed) {
        // mint-burn with !isIndexed && !isIndexedAsMinted
        return NFTTransferTypes.MintBurn;
      } else if (!isIndexedAsMinted) {
        // remint-burn with isIndexed && !isIndexedAsMinted
        return NFTTransferTypes.RemintBurn;
      } else if (allowMintedRemint) {
        // minted-remint-burn with isIndexed && isIndexedAsMinted && allowMintedRemint
        //
        // this is a non-standard special case for improperly implemented NFT contracts
        // that allow a NFT that is currently minted to be reminted again before an
        // intermediate burn.
        //
        // this is a self-transfer from zeroAddress to zeroAddress for an indexed NFT
        // where the previously indexed nft had status `minted` with a non-zeroAddress owner.
        return NFTTransferTypes.MintedRemintBurn;
      } else {
        // remint-burn with isIndexed && isIndexedAsMinted && !allowMintedRemint
        // invalid state transition to be minted and then remint again
        throw new Error(
          `Error: Invalid state transition from minted -> remint-burn\n${formatNFTTransferEventMetadata(metadata)}`,
        );
      }
    } else {
      // a self-transfer to and from the same non-zero address
      if (!isIndexed) {
        // self-transfer with !isIndexed && !isIndexedAsMinted
        // this branch is unreachable because:
        // - from !== zeroAddress; and
        // - !isIndexedAsMinted requires that from === zeroAddress
        // throw an error to validate above assertions
        throw new Error(
          `Error: Invalid state transition from unindexed -> self-transfer\n${formatNFTTransferEventMetadata(metadata)}`,
        );
      } else if (!isIndexedAsMinted) {
        // self-transfer with isIndexed && !isIndexedAsMinted
        throw new Error(
          `Error: invalid state transition from burned -> self-transfer\n${formatNFTTransferEventMetadata(metadata)}`,
        );
      } else {
        // self-transfer with isIndexed && isIndexedAsMinted
        return NFTTransferTypes.SelfTransfer;
      }
    }
  } else if (isMint) {
    if (!isIndexed) {
      // mint with !isIndexed && !isIndexedAsMinted
      return NFTTransferTypes.Mint;
    } else if (!isIndexedAsMinted) {
      // mint with isIndexed && !isIndexedAsMinted
      return NFTTransferTypes.Remint;
    } else if (allowMintedRemint) {
      // mint with isIndexed && isIndexedAsMinted && allowMintedRemint
      //
      // this is a non-standard special case for improperly implemented NFT contracts
      // that allow a NFT that is currently minted to be reminted again before an
      // intermediate burn.
      //
      // this is a transfer from zeroAddress to non-zeroAddress for an indexed NFT
      // where the previously indexed nft had status `minted` with a non-zeroAddress owner.
      return NFTTransferTypes.MintedRemint;
    } else {
      // mint with isIndexed && isIndexedAsMinted && !allowMintedRemint
      throw new Error(
        `Error: Invalid state transition from minted -> mint\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    }
  } else if (isBurn) {
    if (!isIndexed) {
      // burn with !isIndexed && !isIndexedAsMinted
      throw new Error(
        `Error: Invalid state transition from unindexed -> burn\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    } else if (!isIndexedAsMinted) {
      // burn with isIndexed && !isIndexedAsMinted
      throw new Error(
        `Error: Invalid state transition from burned -> burn\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    } else {
      // burn with isIndexed && isIndexedAsMinted
      return NFTTransferTypes.Burn;
    }
  } else {
    // a transfer from a non-zeroAddress to a non-zeroAddress represents a transfer
    if (!isIndexed) {
      // transfer with !isIndexed && !isIndexedAsMinted
      throw new Error(
        `Error: Invalid state transition from unindexed -> transfer\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    } else if (!isIndexedAsMinted) {
      // transfer with isIndexed && !isIndexedAsMinted
      throw new Error(
        `Error: Invalid state transition from burned -> transfer\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    } else {
      // transfer with isIndexed && isIndexedAsMinted
      return NFTTransferTypes.Transfer;
    }
  }
};
