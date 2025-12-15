interface TracingSpanAttributes {
  [key: string]: unknown;
}

interface TracingSpanEvent {
  name: string;
  attributes: TracingSpanAttributes;
  time: number;
}

export interface TracingSpan {
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
  attributes: TracingSpanAttributes;
  status: { code: number; message?: string };
  events: TracingSpanEvent[];
}

export type TracingNode = TracingSpan & { children: TracingNode[] };
export type TracingTrace = TracingNode[];
