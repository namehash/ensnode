import { CoinType, Name } from "../ens";
import { ResolverRecordsSelection } from "./resolver-records-selection";

/**
 * An internal type representing a non-inferred ResolverRecordsResponse, used in situations where
 * access to the more specific inferred type (ResolverRecordsResponse<SELECTION>) is difficult or
 * unnecessary.
 */
export type ResolverRecordsResponseBase = {
  /**
   * The name record, relevant in the context of Reverse Resolution.
   * Null if no name record is set.
   */
  name: Name | null;

  /**
   * Address records, keyed by CoinType.
   * Value is null if no record for the specified CoinType is set.
   *
   * NOTE: ENS resolver address records can store arbitrary string values,
   * including non-EVM addresses — always validate the record value against
   * the format your application expects.
   */
  addresses: Record<CoinType, string | null>;

  /**
   * Text records, keyed by key.
   * Value is null if no record for the specified key is set.
   */
  texts: Record<string, string | null>;
};

/**
 * Represents the strongly-typed set of records based on the provided SELECTION
 *
 * @example
 * ```typescript
 * const selection = {
 *   name: true,
 *   addresses: [60],
 *   texts: ["com.twitter", "avatar"],
 * } as const satisfies ResolverRecordsSelection;
 *
 * type Response = ResolverRecordsResponse<typeof selection>;
 *
 * // results in the following type
 * type Response = {
 *   readonly name: Name | null;
 *   readonly addresses: Record<"60", string | null>;
 *   readonly texts: Record<"avatar" | "com.twitter", string | null>;
 * }
 * ```
 */
export type ResolverRecordsResponse<T extends ResolverRecordsSelection = ResolverRecordsSelection> =
  {
    [K in keyof T as T[K] extends true | any[] ? K : never]: K extends "addresses"
      ? Record<
          `${T["addresses"] extends readonly CoinType[] ? T["addresses"][number] : never}`,
          string | null
        >
      : K extends "texts"
        ? Record<T["texts"] extends readonly string[] ? T["texts"][number] : never, string | null>
        : ResolverRecordsResponseBase[K & keyof ResolverRecordsResponseBase];
  };
