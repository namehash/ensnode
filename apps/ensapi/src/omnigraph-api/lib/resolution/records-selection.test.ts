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
  buildRecordsSelectionFromResolveContainerInfo,
  buildRecordsSelectionFromResolveInfo,
  EMPTY_RECORDS_SELECTION_MESSAGE,
} from "@/omnigraph-api/lib/resolution/records-selection";
import {
  RECORDS_SELECTION_PARAMETRIC_FIELDS,
  RECORDS_SELECTION_SIMPLE_FIELDS,
} from "@/omnigraph-api/lib/resolution/records-selection-config";

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

const DomainResolveType = new GraphQLObjectType({
  name: "DomainResolve",
  fields: {
    trace: { type: GraphQLString },
    records: { type: ResolvedRecordsType },
  },
});

function parseResolveFieldNode(subselection: string) {
  const document = parse(`{ resolve { ${subselection} } }`);
  const operation = document.definitions[0];
  if (operation.kind !== "OperationDefinition") throw new Error("expected operation");

  const resolveField = operation.selectionSet.selections[0];
  if (resolveField.kind !== "Field") throw new Error("expected field");

  return resolveField;
}

function resolveInfoForDomainResolveSubselection(subselection: string): GraphQLResolveInfo {
  return {
    fieldNodes: [parseResolveFieldNode(subselection)],
    fragments: {},
    returnType: DomainResolveType,
    variableValues: {},
  } as unknown as GraphQLResolveInfo;
}

function parseRecordsFieldNode(subselection: string) {
  const document = parse(`{ records { ${subselection} } }`);
  const operation = document.definitions[0];
  if (operation.kind !== "OperationDefinition") throw new Error("expected operation");

  const recordsField = operation.selectionSet.selections[0];
  if (recordsField.kind !== "Field") throw new Error("expected field");

  return recordsField;
}

function mockResolveInfo(
  fieldNodes: ReturnType<typeof parseRecordsFieldNode>[],
  variableValues: Record<string, unknown> = {},
): GraphQLResolveInfo {
  return {
    fieldNodes,
    fragments: {},
    returnType: ResolvedRecordsType,
    variableValues,
  } as unknown as GraphQLResolveInfo;
}

function resolveInfoForRecordsSubselection(subselection: string): GraphQLResolveInfo {
  return mockResolveInfo([parseRecordsFieldNode(subselection)]);
}

/** Simulates GraphQL passing multiple AST field nodes for the same `records` resolver. */
function resolveInfoForMultipleRecordsFieldNodes(...subselections: string[]): GraphQLResolveInfo {
  return mockResolveInfo(subselections.map(parseRecordsFieldNode));
}

describe("buildRecordsSelectionFromResolveInfo", () => {
  it.each(RECORDS_SELECTION_SIMPLE_FIELDS)(
    "selects $graphqlField as $recordsSelectionKey",
    ({ graphqlField, recordsSelectionKey }) => {
      const info = resolveInfoForRecordsSubselection(graphqlField);
      expect(buildRecordsSelectionFromResolveInfo(info)).toEqual({ [recordsSelectionKey]: true });
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

  it("merges selections from multiple field nodes", () => {
    const info = resolveInfoForMultipleRecordsFieldNodes(
      'texts(keys: ["description"])',
      "addresses(coinTypes: [60])",
    );

    expect(buildRecordsSelectionFromResolveInfo(info)).toEqual({
      texts: ["description"],
      addresses: [60],
    });
  });

  it("merges parametric fields with different arguments (aliases)", () => {
    const info = resolveInfoForRecordsSubselection(`
      avatar: texts(keys: ["avatar"])
      description: texts(keys: ["description"])
      eth: addresses(coinTypes: [60])
      btc: addresses(coinTypes: [0])
      abi1: abi(contentTypeMask: "1")
      abi2: abi(contentTypeMask: "2")
      i1: interfaces(ids: ["0x01020304"])
      i2: interfaces(ids: ["0x05060708"])
    `);

    expect(buildRecordsSelectionFromResolveInfo(info)).toEqual({
      texts: ["avatar", "description"],
      addresses: [60, 0],
      abi: 3n,
      interfaces: ["0x01020304", "0x05060708"],
    });
  });

  it("throws when selection is empty", () => {
    const info = resolveInfoForRecordsSubselection("__typename");
    expect(() => buildRecordsSelectionFromResolveInfo(info)).toThrow(
      EMPTY_RECORDS_SELECTION_MESSAGE,
    );
  });

  it("throws when only unknown fields are selected", () => {
    const info = resolveInfoForRecordsSubselection("unknownField");

    expect(() => buildRecordsSelectionFromResolveInfo(info)).toThrow(
      EMPTY_RECORDS_SELECTION_MESSAGE,
    );
  });
});

describe("buildRecordsSelectionFromResolveContainerInfo", () => {
  it("returns null when records is not selected", () => {
    const info = resolveInfoForDomainResolveSubselection("trace acceleration { requested }");

    expect(buildRecordsSelectionFromResolveContainerInfo(info)).toBeNull();
  });

  it("builds selection from resolve { records { ... } } regardless of sibling field order", () => {
    const info = resolveInfoForDomainResolveSubselection(`
      trace
      records {
        texts(keys: ["description"])
        addresses(coinTypes: [60])
      }
    `);

    expect(buildRecordsSelectionFromResolveContainerInfo(info)).toEqual({
      texts: ["description"],
      addresses: [60],
    });
  });

  it("returns null when records is selected with an empty subselection", () => {
    const info = resolveInfoForDomainResolveSubselection("records { __typename }");

    expect(buildRecordsSelectionFromResolveContainerInfo(info)).toBeNull();
  });
});
