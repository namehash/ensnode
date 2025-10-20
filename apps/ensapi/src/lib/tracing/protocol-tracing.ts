import { filterTreeByScope, treeifySpans } from "@/api/lib/tracing/treeify-trace";
import { withActiveSpanAsync } from "@/lib/tracing/auto-span";
import {
  ATTR_PROTOCOL_NAME,
  ATTR_PROTOCOL_STEP,
  ATTR_PROTOCOL_STEP_RESULT,
  ForwardResolutionProtocolStep,
  ProtocolTrace,
  ReverseResolutionProtocolStep,
  TraceableENSProtocol,
} from "@ensnode/ensnode-sdk";
import { type AttributeValue, type Span, trace } from "@opentelemetry/api";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { type ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";

const PROTOCOL_TRACING_SCOPE = "protocol-tracing";
const tracer = trace.getTracer(PROTOCOL_TRACING_SCOPE);

/**
 * An OTel SpanExporter that keeps an in-memory set of protocol-tracer spans by traceId and exposes
 * access via `getTrace`.
 */
export class ProtocolTraceExporter implements SpanExporter {
  private static _instance: ProtocolTraceExporter | null = null;

  private spansByTraceId: Record<string, ReadableSpan[]> = {};

  private constructor() {}

  static singleton(): ProtocolTraceExporter {
    if (!this._instance) this._instance = new ProtocolTraceExporter();
    return this._instance;
  }

  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    for (const span of spans) {
      const { traceId } = span.spanContext();

      // initialize empty if necessary
      this.spansByTraceId[traceId] = this.spansByTraceId[traceId] || [];

      // push new span
      this.spansByTraceId[traceId].push(span);
    }

    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  getTrace(traceId: string | undefined): ProtocolTrace {
    if (!traceId) return [];

    const spansInTrace = this.spansByTraceId[traceId];
    if (!spansInTrace) return [];
    delete this.spansByTraceId[traceId];

    return filterTreeByScope(treeifySpans(spansInTrace), PROTOCOL_TRACING_SCOPE);
  }

  shutdown(): Promise<void> {
    this.spansByTraceId = {};
    return Promise.resolve();
  }
}

/**
 * Executes `fn` in the context of a semantic ENS Protocol Step.
 */
export async function withProtocolStepAsync<
  PROTOCOL extends TraceableENSProtocol,
  STEP extends PROTOCOL extends TraceableENSProtocol.ForwardResolution
    ? ForwardResolutionProtocolStep
    : PROTOCOL extends TraceableENSProtocol.ReverseResolution
      ? ReverseResolutionProtocolStep
      : never,
  Fn extends (span: Span) => Promise<any>,
>(
  protocol: PROTOCOL,
  step: STEP,
  args: Record<string, AttributeValue>,
  fn: Fn,
): Promise<ReturnType<Fn>> {
  return withActiveSpanAsync(
    tracer,
    `${protocol}:${step}`,
    // TODO: include results in span attributes?
    {
      [ATTR_PROTOCOL_NAME]: protocol,
      [ATTR_PROTOCOL_STEP]: step,
      ...args,
    },
    fn,
  );
}

/**
 * Adds a trace event to the span representing a semantic ENS Protocol Step
 */
export function addProtocolStepEvent<
  PROTOCOL extends TraceableENSProtocol,
  STEP extends PROTOCOL extends TraceableENSProtocol.ForwardResolution
    ? ForwardResolutionProtocolStep
    : PROTOCOL extends TraceableENSProtocol.ReverseResolution
      ? ReverseResolutionProtocolStep
      : never,
>(span: Span, protocol: PROTOCOL, step: STEP, result: AttributeValue) {
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
  // TODO: make sure there are no race conditions here, not sure how hono & otel work
  const traceId = trace.getActiveSpan()?.spanContext().traceId;

  const result = await fn();
  const _trace = ProtocolTraceExporter.singleton().getTrace(traceId);

  return { result, trace: _trace };
}
