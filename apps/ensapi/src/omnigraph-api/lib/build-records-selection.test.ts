import {
  type GraphQLFieldConfigMap,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  type GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLString,
  Kind,
  parse,
} from "graphql";
import { describe, expect, it } from "vitest";

import {
  buildRecordsSelectionFromResolveInfo,
  EMPTY_RECORDS_SELECTION_MESSAGE,
} from "@/omnigraph-api/lib/build-records-selection";
import {
  RECORDS_SELECTION_PARAMETRIC_FIELDS,
  RECORDS_SELECTION_SIMPLE_FIELDS,
} from "@/omnigraph-api/lib/records-selection-config";

const stringListArg = new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)));
const intListArg = new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLInt)));

const mockBigIntArg = new GraphQLNonNull(
  new GraphQLScalarType({
    name: "BigInt",
    serialize: String,
    parseValue: (value) => BigInt(value as string | number | bigint),
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING || ast.kind === Kind.INT) return BigInt(ast.value);
      throw new Error("BigInt literal must be a string or integer");
    },
  }),
);

function buildMockResolvedRecordsType() {
  const fields: Record<string, { type: typeof GraphQLString; args?: Record<string, unknown> }> = {};

  for (const { graphqlField } of RECORDS_SELECTION_SIMPLE_FIELDS) {
    fields[graphqlField] = { type: GraphQLString };
  }

  for (const { graphqlField, argName } of RECORDS_SELECTION_PARAMETRIC_FIELDS) {
    const argType =
      argName === "coinTypes"
        ? intListArg
        : argName === "contentTypeMask"
          ? mockBigIntArg
          : stringListArg;
    fields[graphqlField] = { type: GraphQLString, args: { [argName]: { type: argType } } };
  }

  return new GraphQLObjectType({
    name: "ResolvedRecords",
    fields: fields as GraphQLFieldConfigMap<unknown, unknown>,
  });
}

const ResolvedRecordsType = buildMockResolvedRecordsType();

function resolveInfoForRecordsSubselection(subselection: string): GraphQLResolveInfo {
  const document = parse(`{ records { ${subselection} } }`);
  const operation = document.definitions[0];
  if (operation.kind !== "OperationDefinition") throw new Error("expected operation");

  const recordsField = operation.selectionSet.selections[0];
  if (recordsField.kind !== "Field") throw new Error("expected field");

  return {
    fieldNodes: [recordsField],
    fragments: {},
    returnType: ResolvedRecordsType,
    variableValues: {},
  } as unknown as GraphQLResolveInfo;
}

describe("buildRecordsSelectionFromResolveInfo", () => {
  it.each(RECORDS_SELECTION_SIMPLE_FIELDS)(
    "selects $graphqlField as $selectionKey",
    ({ graphqlField, selectionKey }) => {
      const info = resolveInfoForRecordsSubselection(graphqlField);
      expect(buildRecordsSelectionFromResolveInfo(info)).toEqual({ [selectionKey]: true });
    },
  );

  it.each([
    {
      subselection: 'texts(keys: ["description"])',
      expected: { texts: ["description"] },
    },
    {
      subselection: "addresses(coinTypes: [60])",
      expected: { addresses: [60] },
    },
    {
      subselection: 'abi(contentTypeMask: "1")',
      expected: { abi: 1n },
    },
    {
      subselection: 'interfaces(ids: ["0x01020304"])',
      expected: { interfaces: ["0x01020304"] },
    },
  ])("parses parametric field: $subselection", ({ subselection, expected }) => {
    const info = resolveInfoForRecordsSubselection(subselection);
    expect(buildRecordsSelectionFromResolveInfo(info)).toEqual(expected);
  });

  it("builds combined selection across simple and parametric fields", () => {
    const info = resolveInfoForRecordsSubselection(`
      reverseName
      contenthash
      texts(keys: ["avatar", "description"])
      addresses(coinTypes: [60])
      abi(contentTypeMask: "1")
    `);

    expect(buildRecordsSelectionFromResolveInfo(info)).toEqual({
      name: true,
      contenthash: true,
      texts: ["avatar", "description"],
      addresses: [60],
      abi: 1n,
    });
  });

  it("ignores __typename", () => {
    const info = resolveInfoForRecordsSubselection("__typename reverseName");
    expect(buildRecordsSelectionFromResolveInfo(info)).toEqual({ name: true });
  });

  it("throws when selection is empty", () => {
    const info = resolveInfoForRecordsSubselection("__typename");
    expect(() => buildRecordsSelectionFromResolveInfo(info)).toThrow(
      EMPTY_RECORDS_SELECTION_MESSAGE,
    );
  });

  it("throws when only unknown fields are selected", () => {
    const info = {
      fieldNodes: [
        {
          kind: "Field",
          name: { kind: "Name", value: "records" },
          selectionSet: {
            kind: "SelectionSet",
            selections: [
              {
                kind: "Field",
                name: { kind: "Name", value: "unknownField" },
              },
            ],
          },
        },
      ],
      fragments: {},
      returnType: ResolvedRecordsType,
      variableValues: {},
    } as unknown as GraphQLResolveInfo;

    expect(() => buildRecordsSelectionFromResolveInfo(info)).toThrow(
      EMPTY_RECORDS_SELECTION_MESSAGE,
    );
  });
});
