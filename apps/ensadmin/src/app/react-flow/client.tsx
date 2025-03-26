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
import { AnimatedSVGEdge } from "./AnimatedSVGEdge";
import CustomEdgeStartEnd from "@/app/react-flow/custom-components/CustomEdgeStartEnd";
import {LabeledGroupNode} from "@/app/react-flow/custom-components/LabeledGroupNode";
import {initialNodes} from "@/app/react-flow/schema-elements/nodes";
import {initialEdges} from "@/app/react-flow/schema-elements/edges";

export default function ReactFlowClient() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const edgeTypes = {
    animatedSvg: AnimatedSVGEdge,
    'start-end': CustomEdgeStartEnd,
  };

  const nodeTypes = {
    labeledGroupNode: LabeledGroupNode,
  };

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
    >
      <Controls />
      <MiniMap />
      <Background />
    </ReactFlow>
  );
}
