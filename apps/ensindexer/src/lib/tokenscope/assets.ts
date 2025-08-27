import { AccountId, Node, uint256ToHex32 } from "@ensnode/ensnode-sdk";
import { AssetId as CaipAssetId } from "caip";

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
 * @example "eip155:1/erc721:0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/79233663829379634837589865448569342784712482819484549289560981379859480642508"
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
