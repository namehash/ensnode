import { initGraphQLTada } from "gql.tada";

import type { introspection } from "./generated/graphql-env";

// Semantic scalar types — these will eventually be imported from enssdk's
// own type definitions. For now, defined inline.
type Name = string;

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    Address: `0x${string}`;
    BigInt: bigint;
    ChainId: number;
    Hex: `0x${string}`;
    ID: string;
    Name: Name;
    Node: `0x${string}`;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
export { readFragment } from "gql.tada";
