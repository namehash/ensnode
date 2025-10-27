"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AnimatedSVGEdge } from "./custom-components/AnimatedSVGEdge";
import CustomEdgeStartEnd from "./custom-components/CustomEdgeStartEnd";
import { LabeledGroupNode } from "./custom-components/LabeledGroupNode";
import MultipleHandlesNode from "./custom-components/MultipleHandlesNode";
import ParallelogramNode from "./custom-components/ParallelogramNode";
import { initialEdges } from "./schema-elements/edges";
import { initialNodes } from "./schema-elements/nodes";

const edgeTypes = {
  animatedSvg: AnimatedSVGEdge,
  "start-end": CustomEdgeStartEnd,
};

const nodeTypes = {
  labeledGroupNode: LabeledGroupNode,
  multipleHandlesNode: MultipleHandlesNode,
  parallelogramNode: ParallelogramNode,
};

export default function ReactFlowClient() {
  const safeInitialNodes = Array.isArray(initialNodes) ? initialNodes : [];
  const safeInitialEdges = Array.isArray(initialEdges) ? initialEdges : [];

  const [nodes, _setNodes, onNodesChange] = useNodesState(safeInitialNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(safeInitialEdges);

  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      edges={edges}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      style={{ backgroundColor: "#F7F9FB" }}
      proOptions={{
        account: "paid-pro",
        hideAttribution: true,
      }}
    >
      <Controls />
      <MiniMap />
      <Background />
    </ReactFlow>
  );
}
