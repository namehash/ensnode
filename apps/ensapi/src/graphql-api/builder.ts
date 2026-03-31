import SchemaBuilder, { type MaybePromise } from "@pothos/core";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import RelayPlugin from "@pothos/plugin-relay";
import TracingPlugin from "@pothos/plugin-tracing";
import { createOpenTelemetryWrapper } from "@pothos/tracing-opentelemetry";
import type { Address, Hex } from "viem";

import type {
  ChainId,
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
} from "@ensnode/ensnode-sdk";

import type { context } from "@/graphql-api/context";
import { graphqlTracer } from "@/lib/instrumentation/tracer";

const graphqlTracingEnabled =
  process.env.ENSAPI_GRAPHQL_TRACING === "1" || process.env.ENSAPI_GRAPHQL_TRACING === "true";

const createSpan = createOpenTelemetryWrapper(graphqlTracer, {
  includeSource: false,
});

export const builder = new SchemaBuilder<{
  Context: ReturnType<typeof context>;
  Scalars: {
    BigInt: { Input: bigint; Output: bigint };
    Address: { Input: Address; Output: Address };
    Hex: { Input: Hex; Output: Hex };
    ChainId: { Input: ChainId; Output: ChainId };
    CoinType: { Input: CoinType; Output: CoinType };
    Node: { Input: Node; Output: Node };
    Name: { Input: InterpretedName; Output: InterpretedName };
    DomainId: { Input: DomainId; Output: DomainId };
    RegistryId: { Input: RegistryId; Output: RegistryId };
    ResolverId: { Input: ResolverId; Output: ResolverId };
    PermissionsId: { Input: PermissionsId; Output: PermissionsId };
    PermissionsResourceId: { Input: PermissionsResourceId; Output: PermissionsResourceId };
    PermissionsUserId: { Input: PermissionsUserId; Output: PermissionsUserId };
    RegistrationId: { Input: RegistrationId; Output: RegistrationId };
    RenewalId: { Input: RenewalId; Output: RenewalId };
    ResolverRecordsId: { Input: ResolverRecordsId; Output: ResolverRecordsId };
  };

  // the following ensures via typechecker that every t.connection returns a totalCount field
  Connection: {
    totalCount: MaybePromise<number>;
  };
}>({
  plugins: graphqlTracingEnabled
    ? ([TracingPlugin, DataloaderPlugin, RelayPlugin] as const)
    : ([DataloaderPlugin, RelayPlugin] as const),
  ...(graphqlTracingEnabled
    ? {
        tracing: {
          default: () => true,
          wrap: (resolver, options) => createSpan(resolver, options),
        },
      }
    : {}),
  relay: {
    // disable the Query.node & Query.nodes methods
    nodeQueryOptions: false,
    nodesQueryOptions: false,
  },
});
