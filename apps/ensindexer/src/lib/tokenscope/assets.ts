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
 * Builds a CAIP-19 AssetId for the provided NFT.
 *
 * @param nft - The NFT to build an AssetId for
 * @returns The CAIP-19 AssetId for the NFT
 */
export const buildNftAssetId = (nft: SupportedNFT): AssetId => {
  return buildAssetId(nft.contract, nft.tokenId, nft.assetNamespace);
};
