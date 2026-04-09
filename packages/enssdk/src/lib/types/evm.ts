import type { Address as ViemAddress, Hex as ViemHex } from "viem";

/**
 * Represents an Hex string, in the format `0x{string}`.
 */
export type Hex = ViemHex;

/**
 * Represents an EVM Address, in the format `0x{string}`, which may or may not be checksummed.
 */
export type Address = ViemAddress;

/**
 * Represents a normalized (non-checksummed) EVM Address, in the format `0x{string}`, where all
 * characters are lowercase and length is exactly 42.
 *
 * @dev because the Address type is so widely used, nominally typing it would involve a _ton_ of
 *      asNormalizedAddress() casts across the codebase. By avoiding the __brand, we can easily use
 *      EventWithArgs<{ address: NormalizedAddress }> in all of the Ponder event handler args to
 *      declare that the incoming event.args.address is a NormalizedAddress.
 */
export type NormalizedAddress = Address;

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
 * Unix timestamp value
 *
 * Represents the number of seconds that have elapsed
 * since January 1, 1970 (midnight UTC/GMT).
 *
 * Guaranteed to be an integer. May be zero or negative to represent a time at or
 * before Jan 1, 1970.
 */
export type UnixTimestamp = number;

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
