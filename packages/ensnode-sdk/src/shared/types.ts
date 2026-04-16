import type { UnixTimestamp } from "enssdk";

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
