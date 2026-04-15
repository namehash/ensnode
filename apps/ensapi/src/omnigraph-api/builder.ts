import { trace } from "@opentelemetry/api";
import SchemaBuilder, { type MaybePromise } from "@pothos/core";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import RelayPlugin from "@pothos/plugin-relay";
import TracingPlugin, { isRootField } from "@pothos/plugin-tracing";
import { AttributeNames, createOpenTelemetryWrapper } from "@pothos/tracing-opentelemetry";
import type {
  ChainId,
  CoinType,
  DomainId,
  Hex,
  InterpretedLabel,
  InterpretedName,
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
} from "enssdk";
import { getNamedType } from "graphql";
import superjson from "superjson";

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

    // name edge spans as the parent's "Typename.fieldName" for clarity
    if (info.fieldName === "edges") {
      return span.updateName(`${info.path.prev?.typename}.${info.path.prev?.key}`);
    }

    // turn an *Edge.node span name into "Typename([:id])", ex: 'ENSv2Domain([:id])'
    if (info.parentType.name.endsWith("Edge") && info.fieldName === "node") {
      const typename = getNamedType(info.returnType).name;
      const id = (parent as any).node?.id ?? "?";

      return span.updateName(`${typename}(${id})`);
    }

    // otherwise name the span as "Typename.fieldName", ex: 'Query.domain'
    return span.updateName(`${info.parentType.name}.${info.fieldName}`);
  },
});

export type BuilderScalars = {
  ID: { Input: string; Output: string };
  BigInt: { Input: bigint; Output: bigint };
  Address: { Input: NormalizedAddress; Output: NormalizedAddress };
  Hex: { Input: Hex; Output: Hex };
  ChainId: { Input: ChainId; Output: ChainId };
  CoinType: { Input: CoinType; Output: CoinType };
  Node: { Input: Node; Output: Node };
  InterpretedName: { Input: InterpretedName; Output: InterpretedName };
  InterpretedLabel: { Input: InterpretedLabel; Output: InterpretedLabel };
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

export const builder = new SchemaBuilder<{
  Context: ReturnType<typeof context>;
  Scalars: BuilderScalars;

  // the following ensures via typechecker that every t.connection returns a totalCount field
  Connection: {
    totalCount: MaybePromise<number>;
  };

  DefaultEdgesNullability: false;
  DefaultNodeNullability: false;
}>({
  plugins: [TracingPlugin, DataloaderPlugin, RelayPlugin],
  tracing: {
    default: (config) => {
      // NOTE: if you need all the tracing possible in order to debug something, you can return true
      // from this fn and pothos will wrap every resolver in a span for your otel trace, but it may
      // be quite verbose

      // always start a root span
      if (isRootField(config)) return true;

      // always include edges for hierarchy
      // NOTE: this means that setting tracing: true on connection fields will result in (somewhat)
      // superfluous spans, though technically they measure different things
      if (config.name === "edges") return true;

      // note that we don't trace node by default, as this results in lots of spans (one for each node)

      return false;
    },
    wrap: (resolver, options) => createSpan(resolver, options),
  },
  relay: {
    // disable the Query.node & Query.nodes methods
    nodeQueryOptions: false,
    nodesQueryOptions: false,

    // globally configures Edge and Node types to be non-nullable
    edgesFieldOptions: { nullable: false },
    nodeFieldOptions: { nullable: false },
  },
});
