import { ResolveCallsAndResults } from "@/api/lib/resolve-calls-and-results";
import {
  ResolverRecordsResponse,
  ResolverRecordsResponseBase,
  ResolverRecordsSelection,
  bigintToCoinType,
} from "@ensnode/ensnode-sdk";

// TODO: replace with some sort of inferred typing from dizzle
export interface IndexedResolverRecords {
  name: string | null;
  addressRecords: { coinType: bigint; address: string }[];
  textRecords: { key: string; value: string }[];
}

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
  const response: Partial<ResolverRecordsResponseBase> = {};

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

  // cast response as the inferred type based on SELECTION
  return response as ResolverRecordsResponse<SELECTION>;
}

export function makeRecordsResponseFromResolveResults<SELECTION extends ResolverRecordsSelection>(
  selection: SELECTION,
  results: ResolveCallsAndResults<SELECTION>,
): ResolverRecordsResponse<SELECTION> {
  const response: Partial<ResolverRecordsResponseBase> = {};

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

  // cast response as the inferred type based on SELECTION
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
