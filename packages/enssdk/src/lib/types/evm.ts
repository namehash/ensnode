import type { Address } from "viem";

/**
 * Chain ID
 *
 * Represents a unique identifier for a chain.
 * Guaranteed to be a positive integer.
 *
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 **/
export type ChainId = number;

/**
 * Defaultable Chain ID
 *
 * Represents a unique identifier for a chain, or
 * the default chain as defined by ENSIP-19.
 *
 * @see https://docs.ens.domains/ensip/19/#annex-supported-chains
 *
 * Guaranteed to be a non-negative integer.
 **/
export type DefaultableChainId = 0 | ChainId;

/**
 * Represents an account (contract or EOA) at `address` on chain `chainId`.
 *
 * @see https://chainagnostic.org/CAIPs/caip-10
 */
export interface AccountId {
  chainId: ChainId;
  address: Address;
}

/**
 * An enum representing the possible CAIP-19 Asset Namespace values.
 *
 * @see https://chainagnostic.org/CAIPs/caip-19
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
 * Represents an Asset in `assetNamespace` by `tokenId` in `contract`.
 *
 * @see https://chainagnostic.org/CAIPs/caip-19
 */
export interface AssetId {
  assetNamespace: AssetNamespace;
  contract: AccountId;
  tokenId: TokenId;
}
