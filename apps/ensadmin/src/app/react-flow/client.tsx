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
import CustomEdgeStartEnd from "@/app/react-flow/custom-components/CustomEdgeStartEnd";
import { LabeledGroupNode } from "@/app/react-flow/custom-components/LabeledGroupNode";
import MultipleHandlesNode from "@/app/react-flow/custom-components/MultipleHandlesNode";
import ParallelogramNode from "@/app/react-flow/custom-components/ParallelogramNode";
import { initialEdges } from "@/app/react-flow/schema-elements/edges";
import { initialNodes } from "@/app/react-flow/schema-elements/nodes";
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
