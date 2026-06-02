import { initGraphQLTada } from "gql.tada";

import type {
  BeautifiedLabel,
  BeautifiedName,
  BinanceAddress,
  BitcoinAddress,
  BitcoinCashAddress,
  ChainId,
  CoinType,
  DogecoinAddress,
  DomainId,
  Email,
  Hex,
  InterfaceId,
  InterpretedLabel,
  InterpretedName,
  JsonValue,
  LitecoinAddress,
  MonacoinAddress,
  Node,
  NormalizedAddress,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistrationId,
  RegistryId,
  RenewalId,
  ResolverId,
  ResolverRecordsId,
  RippleAddress,
  RootstockAddress,
  SolanaAddress,
} from "../lib/types";
import type { introspection } from "./generated/introspection";

/**
 * Export the introspection for use with clients, especially urql in enskit.
 */
export { introspection } from "./generated/introspection";

/**
 * Scalar type mappings for the Omnigraph schema, representing the type of the serialized response
 * from the Omnigraph API.
 *
 * Keep in sync with the scalars in apps/ensapi/src/omnigraph-api/builder.ts.
 */
export type OmnigraphScalars = {
  ID: string;
  // the omnigraph returns serialized bigint values from the api; further deserialization is
  // handled by enskit's graphcache local resolvers (see cache-exchange.ts)
  BigInt: `${bigint}`;
  JSON: JsonValue;
  Address: NormalizedAddress;
  Email: Email;
  BitcoinAddress: BitcoinAddress;
  LitecoinAddress: LitecoinAddress;
  DogecoinAddress: DogecoinAddress;
  MonacoinAddress: MonacoinAddress;
  RootstockAddress: RootstockAddress;
  RippleAddress: RippleAddress;
  BitcoinCashAddress: BitcoinCashAddress;
  BinanceAddress: BinanceAddress;
  SolanaAddress: SolanaAddress;
  Hex: Hex;
  ChainId: ChainId;
  CoinType: CoinType;
  InterfaceId: InterfaceId;
  InterpretedName: InterpretedName;
  InterpretedLabel: InterpretedLabel;
  BeautifiedName: BeautifiedName;
  BeautifiedLabel: BeautifiedLabel;
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

export const graphql = initGraphQLTada<{
  introspection: typeof introspection;
  scalars: OmnigraphScalars;
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
export { readFragment } from "gql.tada";
