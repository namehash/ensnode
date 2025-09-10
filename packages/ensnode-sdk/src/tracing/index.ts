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
  Operation = "forward-resolution",
  FindResolver = "find-resolver",
  ActiveResolverExists = "active-resolver-exists",
  AccelerateENSIP19ReverseResolver = "accelerate-ensip-19-reverse-resolver",
  AccelerateKnownOffchainLookupResolver = "accelerate-known-offchain-lookup-resolver",
  AccelerateKnownOnchainStaticResolver = "accelerate-known-onchain-static-resolver",
  RequireResolver = "require-resolver",
  ExecuteResolveCalls = "execute-resolve-calls",
}

/**
 * Encodes the set of well-known steps in the ENS Reverse Resolution protocol.
 */
export enum ReverseResolutionProtocolStep {
  Operation = "reverse-resolution",
  ResolveReverseName = "resolve-reverse-name",
  NameRecordExists = "name-record-exists-check",
  ForwardResolveAddressRecord = "forward-resolve-address-record",
  VerifyResolvedAddressMatchesAddress = "verify-resolved-address-matches-address",
}

export const PROTOCOL_ATTRIBUTE_PREFIX = "ens";
export const ATTR_PROTOCOL_NAME = `${PROTOCOL_ATTRIBUTE_PREFIX}.protocol`;
export const ATTR_PROTOCOL_STEP = `${PROTOCOL_ATTRIBUTE_PREFIX}.protocol.step`;
export const ATTR_PROTOCOL_STEP_RESULT = `${PROTOCOL_ATTRIBUTE_PREFIX}.protocol.step.result`;

interface SpanAttributes {
  [key: string]: unknown;
}

interface SpanEvent {
  name: string;
  attributes: SpanAttributes;
  time: number;
}

export interface ProtocolSpan {
  scope: string;
  id: string;
  traceId: string;
  parentSpanContext:
    | {
        traceId: string;
        spanId: string;
      }
    | undefined;
  name: string;
  timestamp: number;
  duration: number;
  attributes: SpanAttributes;
  status: { code: number; message?: string };
  events: SpanEvent[];
}

export type ProtocolSpanTreeNode = ProtocolSpan & { children: ProtocolSpanTreeNode[] };
export type ProtocolTrace = ProtocolSpanTreeNode[];
