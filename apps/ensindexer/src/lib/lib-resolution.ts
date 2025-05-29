import { CoinType } from "@ensnode/ensnode-sdk";
import { MulticallResponse } from "viem";

// TODO: replace with some sort of inferred typing from dizzle
export interface IndexedResolverRecords {
  name: string | null;
  addressRecords: { coinType: bigint; address: string }[];
  textRecords: { key: string; value: string }[];
}

/**
 * Encodes a selection of Resolver records in the context of a specific Node.
 */
export interface ResolverRecordsSelection {
  // TODO: support legacy addr() record?
  // whether to fetch the addr record
  // addr?: boolean;
  // whether to fetch the name record
  name?: boolean;
  // which coinTypes to fetch address records for
  addresses?: CoinType[];
  // which keys to fetch text records for
  texts?: string[];
  // TODO: include others as/if necessary
}

type ResolverRecordsResponseBase = {
  name: { name: string | null };
  addresses: Record<string, string | null>;
  texts: Record<string, string | null>;
};

/**
 * Example usage of ResolverRecordsResponse type:
 *
 * ```typescript
 * const selection = {
 *   name: true,
 *   addresses: [60n, 23n] as const,
 *   texts: ["com.twitter", "avatar"] as const,
 * } satisfies ResolverRecordsSelection;
 *
 * type Response = ResolverRecordsResponse<typeof selection>;
 *
 * // results in the following type
 * type Response = {
 *     name: string | null;
 *     addresses: Record<"60" | "23", string | null>;
 *     texts: Record<"com.twitter" | "avatar", string | null>;
 * }
 * ```
 */
export type ResolverRecordsResponse<T extends ResolverRecordsSelection = ResolverRecordsSelection> =
  {
    [K in keyof T as T[K] extends true | any[] ? K : never]: K extends "addresses"
      ? {
          addresses: Record<
            `${T["addresses"] extends readonly CoinType[] ? T["addresses"][number] : never}`,
            string | null
          >;
        }
      : K extends "texts"
        ? {
            texts: Record<
              T["texts"] extends readonly string[] ? T["texts"][number] : never,
              string | null
            >;
          }
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
    response.name = { name: records.name };
  }

  if (selection.addresses) {
    response.addresses = selection.addresses.reduce(
      (memo, coinType) => {
        memo[coinType.toString()] =
          records.addressRecords.find((r) => r.coinType === coinType)?.address || null;
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
  results: { functionName: string; args: readonly unknown[]; response: MulticallResponse }[],
) {
  const response: Partial<ResolverRecordsResponse<any>> = {};

  if (selection.name) {
    const nameResult = results.find(({ functionName }) => functionName === "name");
    const name = (nameResult?.response.result as string | null) || null;
    response.name = { name };
  }

  if (selection.addresses) {
    response.addresses = selection.addresses.reduce(
      (memo, coinType) => {
        const addressRecord = results.find(
          ({ functionName, args }) => functionName === "addr" && args[1] === coinType,
        );
        memo[coinType.toString()] = (addressRecord?.response.result as string | null) || null;
        return memo;
      },
      {} as ResolverRecordsResponseBase["addresses"],
    );
  }

  if (selection.texts) {
    response.texts = selection.texts.reduce(
      (memo, key) => {
        const textRecord = results.find(
          ({ functionName, args }) => functionName === "text" && args[1] === key,
        );
        memo[key] = (textRecord?.response.result as string | null) || null;
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
