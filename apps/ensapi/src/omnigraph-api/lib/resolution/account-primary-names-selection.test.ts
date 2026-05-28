import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  type GraphQLResolveInfo,
  GraphQLString,
  parse,
} from "graphql";
import { describe, expect, it } from "vitest";

import { buildAccountPrimaryNamesSelection } from "./account-primary-names-selection";

const PrimaryNameByInputType = new GraphQLInputObjectType({
  name: "PrimaryNameByInput",
  fields: {
    coinType: { type: GraphQLInt },
    chain: { type: GraphQLString },
  },
});

const AccountPrimaryNamesWhereInputType = new GraphQLInputObjectType({
  name: "AccountPrimaryNamesWhereInput",
  fields: {
    coinTypes: { type: new GraphQLList(GraphQLInt) },
    chains: { type: new GraphQLList(GraphQLString) },
  },
});

const PrimaryNameRecordType = new GraphQLObjectType({
  name: "PrimaryNameRecord",
  fields: {
    name: { type: GraphQLString },
  },
});

const AccountResolveType = new GraphQLObjectType({
  name: "AccountResolve",
  fields: {
    primaryName: {
      type: PrimaryNameRecordType,
      args: {
        by: { type: PrimaryNameByInputType },
      },
    },
    primaryNames: {
      type: new GraphQLList(PrimaryNameRecordType),
      args: {
        where: { type: AccountPrimaryNamesWhereInputType },
      },
    },
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

function resolveInfoForAccountResolveSubselection(subselection: string): GraphQLResolveInfo {
  return {
    fieldNodes: [parseResolveFieldNode(subselection)],
    fragments: {},
    returnType: AccountResolveType,
    variableValues: {},
  } as unknown as GraphQLResolveInfo;
}

describe("buildAccountPrimaryNamesSelection", () => {
  it("returns null when neither primaryName nor primaryNames is selected", () => {
    const info = resolveInfoForAccountResolveSubselection("trace acceleration { requested }");
    expect(buildAccountPrimaryNamesSelection(info)).toBeNull();
  });

  it("extracts coin type from primaryName(by: { coinType: 60 })", () => {
    const info = resolveInfoForAccountResolveSubselection(
      "primaryName(by: { coinType: 60 }) { name }",
    );
    expect(buildAccountPrimaryNamesSelection(info)).toEqual([60]);
  });

  it("extracts coin types from primaryNames(where: { coinTypes: [60, 0] })", () => {
    const info = resolveInfoForAccountResolveSubselection(
      "primaryNames(where: { coinTypes: [60, 0] }) { name }",
    );
    expect(buildAccountPrimaryNamesSelection(info)).toEqual([60, 0]);
  });

  it("extracts coin type from primaryName(by: { chain: ETH })", () => {
    const info = resolveInfoForAccountResolveSubselection(
      'primaryName(by: { chain: "ETH" }) { name }',
    );
    expect(buildAccountPrimaryNamesSelection(info)).toEqual([60]);
  });

  it("prefers primaryNames over primaryName when both are selected", () => {
    const info = resolveInfoForAccountResolveSubselection(`
        primaryName(by: { coinType: 0 }) { name }
        primaryNames(where: { coinTypes: [60] }) { name }
      `);
    expect(buildAccountPrimaryNamesSelection(info)).toEqual([60]);
  });
});
