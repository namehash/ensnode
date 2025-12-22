/**
 * Chain Name
 *
 * Used as a type for object keys expressing Ponder ideas, such as
 * chain status, or chain metrics.
 */
export type ChainName = string;

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
