import type { CoinType, ContentType, InterfaceId } from "enssdk";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

export type RecordsSelectionSimpleKey = Extract<
  keyof ResolverRecordsSelection,
  "name" | "contenthash" | "pubkey" | "dnszonehash" | "version"
>;

export type RecordsSelectionParametricKey = Extract<
  keyof ResolverRecordsSelection,
  "texts" | "addresses" | "abi" | "interfaces"
>;

export type RecordsSelectionSimpleField = {
  graphqlField: string;
  recordsSelectionKey: RecordsSelectionSimpleKey;
};

export type RecordsSelectionParametricField = {
  graphqlField: string;
  argName: string;
  recordsSelectionKey: RecordsSelectionParametricKey;
  applyToRecordsSelection: (
    recordsSelection: ResolverRecordsSelection,
    args: Record<string, unknown>,
  ) => void;
};

/**
 * GraphQL fields on `ResolvedRecords` that map to boolean flags in {@link ResolverRecordsSelection}.
 * Querying the field (no args) selects that record for resolution.
 */
export const RECORDS_SELECTION_SIMPLE_FIELDS = [
  { graphqlField: "reverseName", recordsSelectionKey: "name" },
  { graphqlField: "contenthash", recordsSelectionKey: "contenthash" },
  { graphqlField: "pubkey", recordsSelectionKey: "pubkey" },
  { graphqlField: "dnszonehash", recordsSelectionKey: "dnszonehash" },
  { graphqlField: "version", recordsSelectionKey: "version" },
] as const satisfies readonly RecordsSelectionSimpleField[];

/**
 * GraphQL fields on `ResolvedRecords` that require arguments specifying which records to resolve.
 */
export const RECORDS_SELECTION_PARAMETRIC_FIELDS = [
  {
    graphqlField: "texts",
    argName: "keys",
    recordsSelectionKey: "texts",
    applyToRecordsSelection: (recordsSelection, args) => {
      const keys = args.keys as string[] | undefined;
      if (keys && keys.length > 0) {
        recordsSelection.texts = [...new Set([...(recordsSelection.texts ?? []), ...keys])];
      }
    },
  },
  {
    graphqlField: "addresses",
    argName: "coinTypes",
    recordsSelectionKey: "addresses",
    applyToRecordsSelection: (recordsSelection, args) => {
      const coinTypes = args.coinTypes as CoinType[] | undefined;
      if (coinTypes && coinTypes.length > 0) {
        recordsSelection.addresses = [
          ...new Set([...(recordsSelection.addresses ?? []), ...coinTypes]),
        ];
      }
    },
  },
  {
    graphqlField: "abi",
    argName: "contentTypeMask",
    recordsSelectionKey: "abi",
    applyToRecordsSelection: (recordsSelection, args) => {
      const contentTypeMask = args.contentTypeMask as ContentType | undefined;
      if (contentTypeMask !== undefined) {
        recordsSelection.abi = (recordsSelection.abi ?? 0n) | contentTypeMask;
      }
    },
  },
  {
    graphqlField: "interfaces",
    argName: "ids",
    recordsSelectionKey: "interfaces",
    applyToRecordsSelection: (recordsSelection, args) => {
      const ids = args.ids as InterfaceId[] | undefined;
      if (ids && ids.length > 0) {
        recordsSelection.interfaces = [
          ...new Set([...(recordsSelection.interfaces ?? []), ...ids]),
        ];
      }
    },
  },
] as const satisfies readonly RecordsSelectionParametricField[];

const simpleFieldByGraphqlName = new Map<string, RecordsSelectionSimpleField>(
  RECORDS_SELECTION_SIMPLE_FIELDS.map((f) => [f.graphqlField, f]),
);

const parametricFieldByGraphqlName = new Map<string, RecordsSelectionParametricField>(
  RECORDS_SELECTION_PARAMETRIC_FIELDS.map((f) => [f.graphqlField, f]),
);

export function getSimpleRecordsSelectionField(
  graphqlField: string,
): RecordsSelectionSimpleField | undefined {
  return simpleFieldByGraphqlName.get(graphqlField);
}

export function getParametricRecordsSelectionField(
  graphqlField: string,
): RecordsSelectionParametricField | undefined {
  return parametricFieldByGraphqlName.get(graphqlField);
}
