import { trace } from "@opentelemetry/api";
import SchemaBuilder, { type MaybePromise } from "@pothos/core";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import RelayPlugin from "@pothos/plugin-relay";
import TracingPlugin from "@pothos/plugin-tracing";
import { createOpenTelemetryWrapper } from "@pothos/tracing-opentelemetry";
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
} from "enssdk";
import type { Address, Hex } from "viem";

import type { context } from "@/omnigraph-api/context";

const tracer = trace.getTracer("graphql");
const createSpan = createOpenTelemetryWrapper(tracer, {
  includeArgs: true,
  includeSource: false,
  onSpan: (span, options, parent, args, ctx, info) => {
    // edge field names are too loud by default and not helpful
    if (info.fieldName === "edges") return span.updateName("edges");

    // turn a node field name into "Typename([:id])"
    if (info.fieldName === "node") {
      const typename = (info.returnType as any).name;
      const id = (parent as any).node.id;

      return span.updateName(`${typename}(${id})`);
    }

    // otherwise name the span as "Typename.fieldName"
    return span.updateName(`${info.parentType.name}.${info.fieldName}`);
  },
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
  plugins: [TracingPlugin, DataloaderPlugin, RelayPlugin],
  tracing: {
    default: () => true,
    wrap: (resolver, options) => createSpan(resolver, options),
  },
  relay: {
    // disable the Query.node & Query.nodes methods
    nodeQueryOptions: false,
    nodesQueryOptions: false,
  },
});
