import { ChainId } from "@ensnode/datasources";

// re-export ChainId for backwards compatibility
export { type ChainId };

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
 * Guaranteed to be an integer.
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
