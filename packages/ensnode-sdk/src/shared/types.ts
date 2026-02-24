import type { Address } from "viem";

import type { DEFAULT_EVM_CHAIN_ID } from "../ens";

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
export type DefaultableChainId = typeof DEFAULT_EVM_CHAIN_ID | ChainId;

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

/**
 * Block Number
 *
 * Guaranteed to be a non-negative integer.
 */
export type BlockNumber = number;

/**
 * Datetime value
 */
export type Datetime = Date;

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
 * Represents a URL that is used for RPC endpoints.
 */
export type RpcUrl = URL;

/**
 * BlockRef
 *
 * Describes a block.
 *
 * We use parameter types to maintain fields layout and documentation across
 * the domain model and its serialized counterpart.
 */
export interface BlockRef {
  /** Block number (height) */
  number: BlockNumber;

  /** Block timestamp */
  timestamp: UnixTimestamp;
}

/**
 * Block range
 *
 * Represents a range of blocks
 */
export interface Blockrange<BlockType = BlockNumber> {
  /** Start block number */
  startBlock?: BlockType;

  /** End block number */
  endBlock?: BlockType;
}

/**
 * Block range with required start block
 *
 * Represents a range of blocks where the start block is required and the end
 * block is optional.
 */
export interface BlockrangeWithStartBlock {
  /**
   * Start block number
   *
   * Guaranteed to be lower than `endBlock` when both are present.
   */
  startBlock: BlockNumber;

  /**
   * End block number
   *
   * Guaranteed to be greater than `startBlock` when both are present.
   */
  endBlock?: BlockNumber;
}

/**
 * Duration
 *
 * Representing a duration in seconds.
 *
 * Guaranteed to be a non-negative integer.
 */
export type Duration = number;

/**
 * A utility type that makes all properties of a type optional recursively,
 * including nested objects and arrays.
 *
 * @example
 * ```typescript
 * type Config = {
 *   a: string;
 *   b: {
 *     x: number;
 *     y: { z: boolean };
 *   };
 *   c: { id: string }[];
 * }
 *
 * type PartialConfig = DeepPartial<Config>;
 * // Results in:
 * // {
 * //   a?: string;
 * //   b?: {
 * //     x?: number;
 * //     y?: { z?: boolean };
 * //   };
 * //   c?: { id?: string }[];
 * // }
 *
 * // Usage:
 * const update: PartialConfig = { b: { y: { z: true } } };
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

/**
 * Helper type to represent an unvalidated version of a business layer type `T`,
 * where all properties are optional.
 *
 * This is useful for building a validated object `T` from partial input,
 * where the input may be missing required fields or have fields that
 * are not yet validated.
 *
 * For example, transforming serialized representation of type `T` into
 * an unvalidated version of `T` that can be later validated against
 * defined business rules and constraints.
 *
 * ```ts
 * function buildUnvalidatedValue(serialized: SerializedChainId): Unvalidated<ChainId> {
 *  // transform serialized chainId into unvalidated number (e.g. parseInt)
 *  return parseInt(serialized, 10);
 * }
 *
 * // Later, we can validate the unvalidated value against our business rules
 * function validateChainId(unvalidatedChainId: Unvalidated<ChainId>): ChainId {
 *   if (typeof unvalidatedChainId !== "number" || unvalidatedChainId <= 0) {
 *     throw new Error("Invalid ChainId");
 *   }
 *
 *   return unvalidatedChainId as ChainId;
 * }
 *
 * ```
 */
export type Unvalidated<T> = DeepPartial<T>;

/**
 * Marks keys in K as required (not undefined) and not null.
 */
export type RequiredAndNotNull<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};
