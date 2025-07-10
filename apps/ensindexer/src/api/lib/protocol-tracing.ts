import { withActiveSpanAsync } from "@/lib/auto-span";
import { type AttributeValue, type Span, trace } from "@opentelemetry/api";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { JsonTraceSerializer } from "@opentelemetry/otlp-transformer";
import { ReadableSpan, SimpleSpanProcessor, SpanExporter } from "@opentelemetry/sdk-trace-base";

const tracer = trace.getTracer("protocol-tracing");

type SerializedTrace = string | undefined;

export class JsonSpanExporter implements SpanExporter {
  private trace: SerializedTrace;

  /**
   * Called to export the spans.
   * @param spans The list of spans to be exported.
   */
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    this.trace = JsonTraceSerializer.serializeRequest(spans)?.toString();
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  /**
   * Clears the collected spans.
   */
  getTrace(): SerializedTrace {
    const result = this.trace;
    this.trace = undefined;
    return result;
  }

  /**
   * Shuts down the exporter.
   */
  shutdown(): Promise<void> {
    this.trace = undefined;
    return Promise.resolve();
  }
}

export enum TraceableENSProtocol {
  ForwardResolution = "forward-resolution",
  ReverseResolution = "reverse-resolution",
}

export enum ReverseResolutionProtocolStep {
  ForwardResolveCoinType = "forward-resolve-coinType",
  SpecificNameRecordExists = "specific-name-record-exists-check",
  ForwardResolveDefaultCoinType = "forward-resolve-default-coinType",
  DefaultNameRecordExists = "default-name-record-exists-check",
  ForwardResolveAddressRecord = "forward-resolve-address-record",
  VerifyResolvedAddressExistence = "verify-resolved-address-existence",
  VerifyResolvedAddressValidity = "verify-resolved-address-validity",
  VerifyResolvedAddressMatchesAddress = "verify-resolved-address-matches-address",
}

export enum ForwardResolutionProtocolStep {
  Test = "test",
}

// executes fn in the context of a semantic ENS Protocol Step
export async function withProtocolStepAsync<
  PROTOCOL extends TraceableENSProtocol,
  STEP extends PROTOCOL extends TraceableENSProtocol.ForwardResolution
    ? ForwardResolutionProtocolStep
    : PROTOCOL extends TraceableENSProtocol.ReverseResolution
      ? ReverseResolutionProtocolStep
      : never,
  Fn extends () => Promise<any>,
>(protocol: PROTOCOL, step: STEP, fn: Fn): Promise<ReturnType<Fn>> {
  return withActiveSpanAsync(
    tracer,
    "ens",
    // TODO: include results in span attributes?
    { "ens.protocol": protocol, "ens.protocol.step": step },
    fn,
  );
}

// adds a trace event to the span representing a semantic ENS Protocol Step
export function addProtocolStepEvent<
  PROTOCOL extends TraceableENSProtocol,
  STEP extends PROTOCOL extends TraceableENSProtocol.ForwardResolution
    ? ForwardResolutionProtocolStep
    : PROTOCOL extends TraceableENSProtocol.ReverseResolution
      ? ReverseResolutionProtocolStep
      : never,
>(span: Span, protocol: PROTOCOL, step: STEP, result: AttributeValue) {
  span.addEvent("ens", {
    "ens.protocol": protocol,
    "ens.protocol.step": step,
    "ens.protocol.step.result": result,
  });
}

export async function captureTrace<Fn extends () => Promise<any>>(
  fn: Fn,
): Promise<{ trace: SerializedTrace; result: ReturnType<Awaited<Fn>> }> {
  const exporter = new JsonSpanExporter();

  new SimpleSpanProcessor(exporter);

  // const result = await withActiveSpanAsync(tracer, "", {}, () => fn());
  // if we can add/remove unique exporter objects we can use that to collect traces
  // otherwise we probably need to have a singleton exporter keep track by request id?
  const result = await fn();
  const trace = exporter.getTrace();
  return { result, trace };
}
