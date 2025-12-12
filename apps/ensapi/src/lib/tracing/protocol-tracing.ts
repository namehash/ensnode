import type { AttributeValue } from "@opentelemetry/api";

import {
  ATTR_PROTOCOL_NAME,
  ATTR_PROTOCOL_STEP,
  ATTR_PROTOCOL_STEP_RESULT,
  type ForwardResolutionProtocolStep,
  type ProtocolTrace,
  type ReverseResolutionProtocolStep,
  type TraceableENSProtocol,
} from "@ensnode/ensnode-sdk";

import { type CustomProtocolSpan, protocolTracingContextManager } from "./protocol-tracing-context";

/**
 * Executes `fn` in the context of a semantic ENS Protocol Step.
 */
export async function withProtocolStep<
  PROTOCOL extends TraceableENSProtocol,
  STEP extends PROTOCOL extends TraceableENSProtocol.ForwardResolution
    ? ForwardResolutionProtocolStep
    : PROTOCOL extends TraceableENSProtocol.ReverseResolution
      ? ReverseResolutionProtocolStep
      : never,
  Fn extends (span: CustomProtocolSpan) => Promise<any>,
>(
  protocol: PROTOCOL,
  step: STEP,
  args: Record<string, AttributeValue>,
  fn: Fn,
): Promise<ReturnType<Fn>> {
  return protocolTracingContextManager.withSpan(
    `${protocol}:${step}`,
    {
      [ATTR_PROTOCOL_NAME]: protocol,
      [ATTR_PROTOCOL_STEP]: step,
      ...args,
    },
    fn,
  );
}

/**
 * Adds a trace event to the span representing a semantic ENS Protocol Step.
 */
export function addProtocolStepEvent<
  PROTOCOL extends TraceableENSProtocol,
  STEP extends PROTOCOL extends TraceableENSProtocol.ForwardResolution
    ? ForwardResolutionProtocolStep
    : PROTOCOL extends TraceableENSProtocol.ReverseResolution
      ? ReverseResolutionProtocolStep
      : never,
>(span: CustomProtocolSpan, protocol: PROTOCOL, step: STEP, result: AttributeValue) {
  span.addEvent(`${protocol}:${step} (${result})`, {
    [ATTR_PROTOCOL_NAME]: protocol,
    [ATTR_PROTOCOL_STEP]: step,
    [ATTR_PROTOCOL_STEP_RESULT]: result,
  });
}

/**
 * Executes `fn`, capturing protocol-level tracing generated during execution.
 */
export async function captureTrace<Fn extends () => Promise<any>>(
  fn: Fn,
): Promise<{ trace: ProtocolTrace; result: Awaited<ReturnType<Fn>> }> {
  return protocolTracingContextManager.runWithTrace(fn);
}
