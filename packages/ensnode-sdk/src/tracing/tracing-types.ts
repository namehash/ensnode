interface SpanAttributes {
  [key: string]: unknown;
}

interface SpanEvent {
  name: string;
  attributes: SpanAttributes;
  time: number;
}

export interface Span {
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

export type TraceNode = Span & { children: TraceNode[] };
export type Trace = TraceNode[];
