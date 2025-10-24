import {
  type AttributeValue,
  type Exception,
  type Span,
  SpanStatusCode,
  type Tracer,
} from "@opentelemetry/api";

// The following internal functions implement the pattern of executing `fn` in the context of a span
// named `name` with attributes via `args` and semantic OTel handling of responses / errors.

export async function withActiveSpanAsync<Fn extends (span: Span) => Promise<any>>(
  tracer: Tracer,
  name: string,
  args: Record<string, AttributeValue>,
  fn: Fn,
): Promise<ReturnType<Fn>> {
  return tracer.startActiveSpan(name, async (span) => {
    // add provded args to span attributes
    for (const [key, value] of Object.entries(args)) {
      span.setAttribute(key, value);
    }

    // automatically handle the obvious cases, including auto-ending the span
    try {
      const result = await fn(span);
      // TODO: add result to attributes or something?
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      if (error instanceof Error) span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });

      // rethrow
      throw error;
    } finally {
      // always end the span
      span.end();
    }
  });
}

export function withSpan<Fn extends (span: Span) => any>(
  tracer: Tracer,
  name: string,
  args: Record<string, AttributeValue>,
  fn: Fn,
): ReturnType<Fn> {
  const span = tracer.startSpan(name);

  // add provded args to span attributes
  for (const [key, value] of Object.entries(args)) {
    span.setAttribute(key, value);
  }

  // automatically handle the obvious cases, including auto-ending the span
  try {
    const result = fn(span);
    // TODO: add result to attributes or something?
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    if (error instanceof Error) span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });

    // rethrow
    throw error;
  } finally {
    // always end the span
    span.end();
  }
}

export async function withSpanAsync<Fn extends (span: Span) => Promise<any>>(
  tracer: Tracer,
  name: string,
  args: Record<string, AttributeValue>,
  fn: Fn,
): Promise<ReturnType<Fn>> {
  const span = tracer.startSpan(name);

  // add provded args to span attributes
  for (const [key, value] of Object.entries(args)) {
    span.setAttribute(key, value);
  }

  // automatically handle the obvious cases, including auto-ending the span
  try {
    const result = await fn(span);
    // TODO: add result to attributes or something?
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    const message = (error as Error)?.message || "Unknown Error";
    span.setStatus({ code: SpanStatusCode.ERROR, message });
    span.recordException(error as Exception);

    // rethrow
    throw error;
  } finally {
    // always end the span
    span.end();
  }
}
