import type { ProtocolSpan, ProtocolTrace } from "@ensnode/ensnode-sdk";

// 1. Define a type for the tree node.
type ProtocolSpanTreeNode = ProtocolSpan & { children: ProtocolSpanTreeNode[] };

// 2. Utility function to tree-ify a ProtocolTrace by parentSpanContext?.id.
export function treeifyProtocolTrace(trace: ProtocolTrace): ProtocolSpanTreeNode[] {
  const idToNode = new Map<string, ProtocolSpanTreeNode>();
  const roots: ProtocolSpanTreeNode[] = [];

  // Create nodes and map by id
  for (const span of trace) {
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

export function TraceRenderer({ trace }: { trace: ProtocolTrace }) {
  console.log(treeifyProtocolTrace(trace));
  return <div className="flex flex-col gap-2">null</div>;
}
