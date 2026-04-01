import { trace } from "@opentelemetry/api";
import SchemaBuilder, { type MaybePromise } from "@pothos/core";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import RelayPlugin from "@pothos/plugin-relay";
import TracingPlugin from "@pothos/plugin-tracing";
import { AttributeNames, createOpenTelemetryWrapper } from "@pothos/tracing-opentelemetry";
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
import { getNamedType } from "graphql";
import superjson from "superjson";
import type { Address, Hex } from "viem";

import type { context } from "@/omnigraph-api/context";

const tracer = trace.getTracer("graphql");
const createSpan = createOpenTelemetryWrapper(tracer, {
  includeSource: false,
  // NOTE: the native implementation of `includeArgs` doesn't handle bigints, so we re-implement in onSpan below
  // https://github.com/hayes/pothos/blob/9fadc4916929a838671714fb7cf8d6bb382bcf14/packages/tracing-opentelemetry/src/index.ts#L54
  includeArgs: false,
  onSpan: (span, options, parent, args, ctx, info) => {
    // inject the graphql.field.args attribute using superjson to handle our BigInt scalar
    span.setAttribute(AttributeNames.FIELD_ARGS, superjson.stringify(args));

    // edge span names are too loud by default and not helpful
    if (info.fieldName === "edges") return span.updateName("edges");

    // turn an *Edge.node span name into "Typename([:id])", ex: 'ENSv2Domain([:id])'
    if (info.parentType.name.endsWith("Edge") && info.fieldName === "node") {
      const typename = getNamedType(info.returnType);
      const id = (parent as any).node?.id ?? "Unknown";

      return span.updateName(`${typename}(${id})`);
    }

    // otherwise name the span as "Typename.fieldName", ex: 'Query.domain'
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
