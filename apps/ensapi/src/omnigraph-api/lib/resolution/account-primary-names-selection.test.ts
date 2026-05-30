import { coinNameToTypeMap } from "@ensdomains/address-encoder";
import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  type GraphQLResolveInfo,
  GraphQLString,
} from "graphql";
import { describe, expect, it } from "vitest";

import { parseFieldNode } from "@/omnigraph-api/lib/resolution/test-helpers";

import { buildAccountPrimaryNamesSelection } from "./account-primary-names-selection";

// These mock types mirror the real Pothos-generated schema types. They cannot be imported
// from `@/omnigraph-api/schema` directly because doing so loads the full Pothos schema into
// the test process, which creates a second in-memory instance of `graphql`. graphql-js's
// `instanceOf` checks then fail when comparing types across those two instances (the "Duplicate
// graphql modules" error). Keeping the mocks here avoids that issue; ensure names stay in sync
// with the real schema when those types change.
const PrimaryNameByInputType = new GraphQLInputObjectType({
  name: "PrimaryNameByInput",
  fields: {
    coinType: { type: GraphQLInt },
    chain: { type: GraphQLString },
  },
});

const PrimaryNamesWhereInputType = new GraphQLInputObjectType({
  name: "PrimaryNamesWhereInput",
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
        where: { type: PrimaryNamesWhereInputType },
      },
    },
  },
});

function resolveInfoForAccountResolveSubselection(subselection: string): GraphQLResolveInfo {
  return {
    fieldNodes: [parseFieldNode("resolve", subselection)],
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

  it("extracts coin type from primaryName(by: { chain: ETHEREUM })", () => {
    const info = resolveInfoForAccountResolveSubselection(
      'primaryName(by: { chain: "ETHEREUM" }) { name }',
    );
    expect(buildAccountPrimaryNamesSelection(info)).toEqual([coinNameToTypeMap.eth]);
  });

  it("merges coin types from primaryName and primaryNames when both are selected", () => {
    const info = resolveInfoForAccountResolveSubselection(`
        primaryName(by: { coinType: 0 }) { name }
        primaryNames(where: { coinTypes: [60] }) { name }
      `);
    expect(buildAccountPrimaryNamesSelection(info)).toEqual([60, 0]);
  });

  it("merges coin types from multiple aliased primaryName and primaryNames fields", () => {
    const info = resolveInfoForAccountResolveSubselection(`
        one: primaryName(by: { coinType: ${coinNameToTypeMap.btc} }) { name }
        two: primaryName(by: { coinType: ${coinNameToTypeMap.ltc} }) { name }
        three: primaryNames(where: { coinTypes: [${coinNameToTypeMap.doge}, ${coinNameToTypeMap.sol}] }) { name }
        four: primaryNames(where: { chains: ["DEFAULT", "ETHEREUM", "ARBITRUM_ONE"] }) { name }
        five: primaryName(by: { chain: "BASE" }) { name }
      `);

    expect(buildAccountPrimaryNamesSelection(info)).toEqual([
      coinNameToTypeMap.doge,
      coinNameToTypeMap.sol,
      coinNameToTypeMap.default,
      coinNameToTypeMap.eth,
      coinNameToTypeMap.arb1,
      coinNameToTypeMap.btc,
      coinNameToTypeMap.ltc,
      coinNameToTypeMap.base,
    ]);
  });
});
