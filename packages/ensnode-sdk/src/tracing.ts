/**
 * Identifiers for each traceable ENS protocol.
 */
export enum TraceableENSProtocol {
  ForwardResolution = "forward-resolution",
  ReverseResolution = "reverse-resolution",
}

/**
 * Encodes the set of well-known steps in the ENS Forward Resolution protocol.
 */
export enum ForwardResolutionProtocolStep {
  Operation = "operation",
  FindResolver = "find-resolver",
  ActiveResolverExists = "active-resolver-exists",
  AccelerateKnownOffchainLookupResolver = "accelerate-known-offchain-lookup-resolver",
  AccelerateKnownOnchainStaticResolver = "accelerate-known-onchain-static-resolver",
  RequireResolver = "require-resolver",
  ExecuteResolveCalls = "execute-resolve-calls",
}

/**
 * Encodes the set of well-known steps in the ENS Reverse Resolution protocol.
 */
export enum ReverseResolutionProtocolStep {
  Operation = "operation",
  ForwardResolveCoinType = "forward-resolve-coinType",
  NameRecordExists = "name-record-exists-check",
  ForwardResolveAddressRecord = "forward-resolve-address-record",
  VerifyResolvedAddressExistence = "verify-resolved-address-existence",
  VerifyResolvedAddressValidity = "verify-resolved-address-validity",
  VerifyResolvedAddressMatchesAddress = "verify-resolved-address-matches-address",
}

const PROTOCOL_ATTRIBUTE_PREFIX = "ens";

export const ATTR_PROTOCOL_NAME = `${PROTOCOL_ATTRIBUTE_PREFIX}.protocol`;
export const ATTR_PROTOCOL_STEP = `${PROTOCOL_ATTRIBUTE_PREFIX}.protocol.step`;
export const ATTR_PROTOCOL_STEP_RESULT = `${PROTOCOL_ATTRIBUTE_PREFIX}.protocol.step.result`;

/**
 * Re-implements hrTimeToMicroseconds to avoid a dependency on @opentelemetry/core.
 *
 * @see https://github.com/open-telemetry/opentelemetry-js/blob/41ba7f57cbf5ae22290168188b467e0c60cd4765/packages/opentelemetry-core/src/common/time.ts#L135
 */
export function hrTimeToMicroseconds(time: [number, number] /* api.HrTime */): number {
  return time[0] * 1e6 + time[1] / 1e3;
}

/**
 * Encodes a ReadableSpan as a consumer-friendly and externally-visible JSON-representable object.
 *
 * NOTE: to avoid a dependency on @opentelemetry/sdk-trace-base and an obscure typing issue related
 * to the patched version necessary for it to run in ENSIndexer, we type the span as `any`, but note
 * that it is ReadableSpan.
 */
export const readableSpanToProtocolSpan = (span: any /* ReadableSpan */) => ({
  id: span.spanContext().spanId,
  traceId: span.spanContext().traceId,
  parentSpanContext: span.parentSpanContext,
  name: span.name,
  timestamp: hrTimeToMicroseconds(span.startTime),
  duration: hrTimeToMicroseconds(span.duration),
  // only export `ens.*` attributes to avoid leaking internal details
  attributes: Object.fromEntries(
    Object.entries(span.attributes).filter(([key]) =>
      key.startsWith(`${PROTOCOL_ATTRIBUTE_PREFIX}.`),
    ),
  ),
  status: span.status,
  events: span.events,
});

export type ProtocolSpan = ReturnType<typeof readableSpanToProtocolSpan>;
export type ProtocolTrace = ProtocolSpan[];
