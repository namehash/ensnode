import { ProtocolSpan, ProtocolSpanTreeNode, ProtocolTrace } from "@ensnode/ensnode-sdk";
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";

/**
 * Re-implements hrTimeToMicroseconds to avoid a dependency on @opentelemetry/core.
 *
 * @see https://github.com/open-telemetry/opentelemetry-js/blob/41ba7f57cbf5ae22290168188b467e0c60cd4765/packages/opentelemetry-core/src/common/time.ts#L135
 */
export function hrTimeToMicroseconds(time: [number, number] /* api.HrTime */): number {
  return time[0] * 1e6 + time[1] / 1e3;
}

/**
 * Encodes a ReadableSpan as a consumer-friendly and externally-visible JSON-representable ProtocolSpan.
 *
 * NOTE: to avoid a dependency on @opentelemetry/sdk-trace-base and an obscure typing issue related
 * to the patched version necessary for it to run in ENSIndexer, we type the span as `any`, but note
 * that it is ReadableSpan.
 */
const readableSpanToProtocolSpan = (span: ReadableSpan): ProtocolSpan => ({
  scope: span.instrumentationScope.name,
  id: span.spanContext().spanId,
  traceId: span.spanContext().traceId,
  parentSpanContext: span.parentSpanContext,
  name: span.name,
  timestamp: hrTimeToMicroseconds(span.startTime),
  duration: hrTimeToMicroseconds(span.duration),
  attributes: span.attributes,
  status: span.status,
  events: span.events.map((event: any) => ({
    name: event.name,
    attributes: event.attributes,
    time: hrTimeToMicroseconds(event.time),
  })),
});

// thank you claude-san
export function treeifySpans(trace: ReadableSpan[]): ProtocolTrace {
  const idToNode = new Map<string, ProtocolSpanTreeNode>();
  const roots: ProtocolSpanTreeNode[] = [];

  const withIds = trace.map(readableSpanToProtocolSpan);

  // Create nodes and map by id
  for (const span of withIds) {
    idToNode.set(span.id, { ...span, children: [] });
  }

  // Assign children to parents
  for (const node of idToNode.values()) {
    const parentId = node.parentSpanContext?.spanId;
    if (parentId && idToNode.has(parentId)) {
      idToNode.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// thank you claude-san
export function filterTreeByScope(trace: ProtocolTrace, scope: string) {
  // Step 1: Define recursive filter function
  function filterNodes(nodes: ProtocolTrace, scope: string): ProtocolTrace {
    const result: ProtocolTrace = [];
    for (const node of nodes) {
      // Recursively filter children first
      const filteredChildren = filterNodes(node.children, scope);

      if (node.scope === scope) {
        // Keep node, but with filtered children
        result.push({ ...node, children: filteredChildren });
      } else {
        // Flatten: inject children into parent level
        result.push(...filteredChildren);
      }
    }
    return result;
  }

  // Step 2: Call recursive function on root
  return filterNodes(trace, scope);
}
