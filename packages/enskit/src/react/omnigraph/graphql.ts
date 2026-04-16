import type { introspection, OmnigraphScalars } from "enssdk/omnigraph";
import { initGraphQLTada } from "gql.tada";

export const graphql = initGraphQLTada<{
  introspection: typeof introspection;
  scalars: Omit<OmnigraphScalars, "BigInt"> & {
    // override the default Omnigraph Scalar definitions to include a deserialized BigInt (see cache-exchange.ts)
    BigInt: bigint;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
export { readFragment } from "gql.tada";
