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
  selectionKey: RecordsSelectionSimpleKey;
};

export type RecordsSelectionParametricField = {
  graphqlField: string;
  argName: string;
  selectionKey: RecordsSelectionParametricKey;
  applySelection: (selection: ResolverRecordsSelection, args: Record<string, unknown>) => void;
};

/**
 * GraphQL fields on `ResolvedRecords` that map to boolean flags in {@link ResolverRecordsSelection}.
 * Querying the field (no args) selects that record for resolution.
 */
export const RECORDS_SELECTION_SIMPLE_FIELDS = [
  { graphqlField: "reverseName", selectionKey: "name" },
  { graphqlField: "contenthash", selectionKey: "contenthash" },
  { graphqlField: "pubkey", selectionKey: "pubkey" },
  { graphqlField: "dnszonehash", selectionKey: "dnszonehash" },
  { graphqlField: "version", selectionKey: "version" },
] as const satisfies readonly RecordsSelectionSimpleField[];

/**
 * GraphQL fields on `ResolvedRecords` that require arguments specifying which records to resolve.
 */
export const RECORDS_SELECTION_PARAMETRIC_FIELDS = [
  {
    graphqlField: "texts",
    argName: "keys",
    selectionKey: "texts",
    applySelection: (selection, args) => {
      selection.texts = args.keys as string[];
    },
  },
  {
    graphqlField: "addresses",
    argName: "coinTypes",
    selectionKey: "addresses",
    applySelection: (selection, args) => {
      selection.addresses = args.coinTypes as CoinType[];
    },
  },
  {
    graphqlField: "abi",
    argName: "contentTypeMask",
    selectionKey: "abi",
    applySelection: (selection, args) => {
      selection.abi = args.contentTypeMask as ContentType;
    },
  },
  {
    graphqlField: "interfaces",
    argName: "ids",
    selectionKey: "interfaces",
    applySelection: (selection, args) => {
      selection.interfaces = args.ids as InterfaceId[];
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
