import {
  Background,
  type Connection,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  Position,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import React, { useCallback } from "react";
import { AnimatedSVGEdge } from "./AnimatedSVGEdge";

import "@xyflow/react/dist/style.css";

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 600, y: 200 },
    data: { label: "ENSNode" },
    targetPosition: Position.Left,
  },
  { id: "2", position: { x: 200, y: 200 }, data: { label: "Some blockchain" } },
  {
    id: "3",
    position: { x: 400, y: 100 },
    data: { label: "Some other blockchain" },
  },
];

export default function ReactFlowClient() {
  const edgeTypes = {
    animatedSvg: AnimatedSVGEdge,
  };

  const initialEdges: Edge[] = [
    {
      id: "2->1",
      type: "animatedSvg",
      source: "2",
      target: "1",
      markerEnd: {
        type: MarkerType.Arrow,
        width: 20,
        height: 20,
        color: "#05eeff",
      },
      style: {
        strokeWidth: 1,
        stroke: "#05eeff",
      },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "animatedSvg",
            markerEnd: {
              type: MarkerType.Arrow,
              width: 20,
              height: 20,
              color: "#05eeff",
            },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      style={{ backgroundColor: "#F7F9FB" }}
    >
      <Controls />
      <MiniMap />
      <Background />
    </ReactFlow>
  );
}
