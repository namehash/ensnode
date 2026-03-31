import { initGraphQLTada } from "gql.tada";
import type { Address, Hex } from "viem";

import type {
  CoinType,
  DomainId,
  InterpretedName,
  Node,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistrationId,
  RegistryId,
  RenewalId,
  ResolverId,
  ResolverRecordsId,
} from "../lib/types";
import type { introspection } from "./generated/graphql-env";

export const graphql = initGraphQLTada<{
  introspection: introspection;
  // NOTE: keep these type defs in sync with the scalars in apps/ensapi/src/graphql-api/builder.ts
  scalars: {
    ID: string;
    // NOTE: graphql clients don't really do deserialization of scalars like bigint, so instead we
    // just helpfully type the string as 'a stringified bigint'
    BigInt: `${bigint}`;
    Address: Address;
    Hex: Hex;
    ChainId: number;
    CoinType: CoinType;
    Name: InterpretedName;
    Node: Node;
    DomainId: DomainId;
    RegistryId: RegistryId;
    ResolverId: ResolverId;
    PermissionsId: PermissionsId;
    PermissionsResourceId: PermissionsResourceId;
    PermissionsUserId: PermissionsUserId;
    RegistrationId: RegistrationId;
    RenewalId: RenewalId;
    ResolverRecordsId: ResolverRecordsId;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
export { readFragment } from "gql.tada";
