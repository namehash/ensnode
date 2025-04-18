import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import React from "react";
import "@xyflow/react/dist/style.css";
import CustomEdgeStartEnd from "@/app/inspector/custom-components/CustomEdgeStartEnd";
import { LabeledGroupNode } from "@/app/inspector/custom-components/LabeledGroupNode";
import MultipleHandlesNode from "@/app/inspector/custom-components/MultipleHandlesNode";
import ParallelogramNode from "@/app/inspector/custom-components/ParallelogramNode";
import { initialEdges } from "@/app/inspector/schema-elements/edges";
import { initialNodes } from "@/app/inspector/schema-elements/nodes";
import { AnimatedSVGEdge } from "./custom-components/AnimatedSVGEdge";

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

  const [nodes, setNodes, onNodesChange] = useNodesState(safeInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(safeInitialEdges);

  return (
    <div className="h-[calc(100vh-6rem)]">
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
    </div>
  );
}
