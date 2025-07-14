import { ResolveCallsAndResults } from "@/api/lib/resolve-calls-and-results";
import { ResolverRecordsSelection } from "@/api/lib/resolver-records-selection";
import { CoinType, bigintToCoinType } from "@ensnode/ensnode-sdk";

// TODO: replace with some sort of inferred typing from dizzle
export interface IndexedResolverRecords {
  name: string | null;
  addressRecords: { coinType: bigint; address: string }[];
  textRecords: { key: string; value: string }[];
}

type ResolverRecordsResponseBase = {
  /**
   * The name record.
   */
  name: string | null;

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
 *   readonly name: string | null;
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

/**
 * Formats IndexedResolverRecords into a ResolverRecordsResponse based on the provided selection.
 *
 * @param selection - The selection specifying which records to include in the response
 * @param records - The indexed resolver records to format
 * @returns A formatted ResolverRecordsResponse containing only the requested records
 */
export function makeRecordsResponseFromIndexedRecords<SELECTION extends ResolverRecordsSelection>(
  selection: SELECTION,
  records: IndexedResolverRecords,
): ResolverRecordsResponse<SELECTION> {
  const response: Partial<ResolverRecordsResponse<any>> = {};

  if (selection.name) {
    response.name = records.name;
  }

  if (selection.addresses) {
    response.addresses = selection.addresses.reduce(
      (memo, coinType) => {
        memo[coinType] =
          records.addressRecords.find((r) => bigintToCoinType(r.coinType) === coinType)?.address ||
          null;
        return memo;
      },
      {} as ResolverRecordsResponseBase["addresses"],
    );
  }

  if (selection.texts) {
    response.texts = selection.texts.reduce(
      (memo, key) => {
        memo[key] = records.textRecords.find((r) => r.key === key)?.value ?? null;
        return memo;
      },
      {} as ResolverRecordsResponseBase["texts"],
    );
  }

  return response as ResolverRecordsResponse<SELECTION>;
}

export function makeRecordsResponseFromResolveResults<SELECTION extends ResolverRecordsSelection>(
  selection: SELECTION,
  results: ResolveCallsAndResults<SELECTION>,
): ResolverRecordsResponse<SELECTION> {
  const response: Partial<ResolverRecordsResponse<any>> = {};

  if (selection.name) {
    const nameResult = results.find(({ call: { functionName } }) => functionName === "name");
    const name = (nameResult?.result as string | null) || null;
    response.name = name;
  }

  if (selection.addresses) {
    response.addresses = selection.addresses.reduce(
      (memo, coinType) => {
        const addressRecord = results.find(
          ({ call: { functionName, args } }) =>
            functionName === "addr" && bigintToCoinType(args[1] as bigint) === coinType,
        );
        memo[coinType] = (addressRecord?.result as string | null) || null;
        return memo;
      },
      {} as ResolverRecordsResponseBase["addresses"],
    );
  }

  if (selection.texts) {
    response.texts = selection.texts.reduce(
      (memo, key) => {
        const textRecord = results.find(
          ({ call: { functionName, args } }) => functionName === "text" && args[1] === key,
        );
        memo[key] = (textRecord?.result as string | null) || null;
        return memo;
      },
      {} as ResolverRecordsResponseBase["texts"],
    );
  }

  return response as ResolverRecordsResponse<SELECTION>;
}

export function makeEmptyResolverRecordsResponse<SELECTION extends ResolverRecordsSelection>(
  selection: SELECTION,
) {
  return makeRecordsResponseFromIndexedRecords(selection, {
    name: null,
    addressRecords: [],
    textRecords: [],
  });
}
