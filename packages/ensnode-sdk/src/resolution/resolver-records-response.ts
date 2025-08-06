import { CoinType, Name } from "../ens";
import { ResolverRecordsSelection } from "./resolver-records-selection";

/**
 * An internal type representing a non-inferred ResolverRecordsResponse, used in situations where
 * access to the more specific inferred type (ResolverRecordsResponse<SELECTION>) is difficult or
 * unnecessary.
 */
export type ResolverRecordsResponseBase = {
  /**
   * The name record.
   */
  name: Name | null;

  /**
   * Address records, keyed by CoinType.
   */
  addresses: Record<CoinType, string | null>;

  /**
   * Text records, keyed by key.
   */
  texts: Record<string, string | null>;
};

/**
 * Example usage of ResolverRecordsResponse type:
 *
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
