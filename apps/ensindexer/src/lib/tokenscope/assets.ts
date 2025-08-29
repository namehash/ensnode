import { AccountId, ChainId, Node, uint256ToHex32 } from "@ensnode/ensnode-sdk";
import { AssetId as CaipAssetId } from "caip";
import { Address, Hex, isAddressEqual, zeroAddress } from "viem";

/**
 * An enum representing the possible CAIP-19 Asset Namespace values.
 */
export const AssetNamespaces = {
  ERC721: "erc721",
  ERC1155: "erc1155",
} as const;

export type AssetNamespace = (typeof AssetNamespaces)[keyof typeof AssetNamespaces];

/**
 * A uint256 value that identifies a specific NFT within a NFT contract.
 */
export type TokenId = bigint;

/**
 * A struct representing a NFT that has been minted by a SupportedNFTIssuer.
 *
 * Any ERC1155 SupportedNFT we create is guaranteed to never have a balance > 1.
 */
export interface SupportedNFT {
  assetNamespace: AssetNamespace;
  contract: AccountId;
  tokenId: TokenId;
  domainId: Node;
}

/**
 * A globally unique reference to a NFT.
 *
 * Formatted as a fully lowercase CAIP-19 AssetId.
 *
 * @see https://chainagnostic.org/CAIPs/caip-19
 * @example "eip155:1/erc721:0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"
 *          for vitalik.eth in the eth base registrar on mainnet.
 */
export type AssetId = string;

/**
 * Builds a CAIP-19 AssetId for the NFT represented by the given contract,
 * tokenId, and assetNamespace.
 *
 * @param contract - The contract that manages the NFT
 * @param tokenId - The tokenId of the NFT
 * @param assetNamespace - The assetNamespace of the NFT
 * @returns The CAIP-19 AssetId for the NFT represented by the given contract,
 *          tokenId, and assetNamespace
 */
export const buildAssetId = (
  contract: AccountId,
  tokenId: TokenId,
  assetNamespace: AssetNamespace,
): AssetId => {
  return CaipAssetId.format({
    chainId: { namespace: "eip155", reference: contract.chainId.toString() },
    assetName: { namespace: assetNamespace, reference: contract.address },
    tokenId: uint256ToHex32(tokenId),
  }).toLowerCase();
};

/**
 * Builds a CAIP-19 AssetId for the SupportedNFT.
 *
 * @param nft - The SupportedNFT to build an AssetId for
 * @returns The CAIP-19 AssetId for the SupportedNFT
 */
export const buildSupportedNFTAssetId = (nft: SupportedNFT): AssetId => {
  return buildAssetId(nft.contract, nft.tokenId, nft.assetNamespace);
};

/**
 * An enum representing the mint status of a SupportedNFT.
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
  nft: SupportedNFT;
}

export const formatNFTTransferEventMetadata = (metadata: NFTTransferEventMetadata): string => {
  return [
    `Event: ${metadata.eventHandlerName}`,
    `Chain ID: ${metadata.chainId}`,
    `Block Number: ${metadata.blockNumber}`,
    `Transaction Hash: ${metadata.transactionHash}`,
    `NFT: ${buildSupportedNFTAssetId(metadata.nft)}`,
  ]
    .map((line) => ` - ${line}`)
    .join("\n");
};

/**
 * An enum representing the type of transfer that has occurred to a SupportedNFT.
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
  const isMinted = isIndexed && !isAddressEqual(currentlyIndexedOwner, zeroAddress);

  if (isIndexed && !isAddressEqual(currentlyIndexedOwner, from)) {
    if (allowMintedRemint && isAddressEqual(from, zeroAddress)) {
      // special case to allow minted remint from improperly implemented NFT contracts
    } else {
      throw new Error(
        `Error: Sending from ${from} conflicts with currently indexed owner ${currentlyIndexedOwner}.\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    }
  }

  if (isAddressEqual(from, to)) {
    if (isAddressEqual(from, zeroAddress)) {
      // a transfer to and from the zeroAddress represents either mint-burn or remint-burn
      if (!isIndexed) {
        // mint-burn with !isIndexed && !isMinted
        return NFTTransferTypes.MintBurn;
      } else if (!isMinted) {
        // remint-burn with isIndexed && !isMinted
        return NFTTransferTypes.RemintBurn;
      } else if (allowMintedRemint) {
        // minted-remint-burn with isIndexed && isMinted && allowDoubleMint
        //
        // this is a non-standard special case for improperly implemented NFT contracts
        // that allow a NFT that is currently minted to be reminted again before an
        // intermediate burn.
        //
        // this is a transfer from zeroAddress to zeroAddress for an indexed NFT
        // where the previously indexed nft had status `minted` with a non-zeroAddress owner.
        return NFTTransferTypes.MintedRemintBurn;
      } else {
        // remint-burn with isIndexed && isMinted && !allowDoubleMint
        // invalid state transition to be minted and then remint again
        throw new Error(
          `Error: Invalid state transition from minted -> remint-burn\n${formatNFTTransferEventMetadata(metadata)}`,
        );
      }
    } else {
      // a transfer to and from a non-zero address represents a self-transfer
      if (!isIndexed) {
        // self-transfer with !isIndexed && !isMinted
        // this branch is unreachable because:
        // - from !== zeroAddress; and
        // - !isMinted requires that from === zeroAddress
        // throw an error to validate above assertions
        throw new Error(
          `Error: Invalid state transition from unindexed -> self-transfer\n${formatNFTTransferEventMetadata(metadata)}`,
        );
      } else if (!isMinted) {
        // self-transfer with isIndexed && !isMinted
        throw new Error(
          `Error: invalid state transition from burned -> self-transfer\n${formatNFTTransferEventMetadata(metadata)}`,
        );
      } else {
        // self-transfer with isIndexed && isMinted
        return NFTTransferTypes.SelfTransfer;
      }
    }
  } else if (isAddressEqual(from, zeroAddress)) {
    // a transfer from the zeroAddress to a non-zeroAddress represents minting
    if (!isIndexed) {
      // mint with !isIndexed && !isMinted
      return NFTTransferTypes.Mint;
    } else if (!isMinted) {
      // mint with isIndexed && !isMinted
      return NFTTransferTypes.Remint;
    } else if (allowMintedRemint) {
      // mint with isIndexed && isMinted && allowDoubleMint
      //
      // this is a non-standard special case for improperly implemented NFT contracts
      // that allow a NFT that is currently minted to be reminted again before an
      // intermediate burn.
      //
      // this is a transfer from zeroAddress to non-zeroAddress for an indexed NFT
      // where the previously indexed nft had status `minted` with a non-zeroAddress owner.
      return NFTTransferTypes.MintedRemint;
    } else {
      // mint with isIndexed && isMinted && !allowDoubleMint
      throw new Error(
        `Error: Invalid state transition from minted -> mint\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    }
  } else if (isAddressEqual(to, zeroAddress)) {
    // a transfer from a non-zeroAddress to the zeroAddress represents burning
    if (!isIndexed) {
      // burn with !isIndexed && !isMinted
      throw new Error(
        `Error: Invalid state transition from unindexed -> burn\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    } else if (!isMinted) {
      // burn with isIndexed && !isMinted
      throw new Error(
        `Error: Invalid state transition from burned -> burn\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    } else {
      // burn with isIndexed && isMinted
      return NFTTransferTypes.Burn;
    }
  } else {
    // a transfer from a non-zeroAddress to a non-zeroAddress represents a transfer
    if (!isIndexed) {
      // transfer with !isIndexed && !isMinted
      throw new Error(
        `Error: Invalid state transition from unindexed -> transfer\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    } else if (!isMinted) {
      // transfer with isIndexed && !isMinted
      throw new Error(
        `Error: Invalid state transition from burned -> transfer\n${formatNFTTransferEventMetadata(metadata)}`,
      );
    } else {
      // transfer with isIndexed && isMinted
      return NFTTransferTypes.Transfer;
    }
  }
};
