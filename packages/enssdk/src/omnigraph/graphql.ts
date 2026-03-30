import { initGraphQLTada } from "gql.tada";

import type { introspection } from "./generated/graphql-env";

// Semantic scalar types — these will eventually be imported from enssdk's
// own type definitions. For now, defined inline.
type Name = string;
type UnixTimestamp = number;

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    Name: Name;
    BigInt: bigint;
    Bytes: `0x${string}`;
    ID: string;
    UnixTimestamp: UnixTimestamp;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
export { readFragment } from "gql.tada";
