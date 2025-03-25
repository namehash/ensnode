"use client";

import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import React, { useCallback } from "react";
import { AnimatedSVGEdge } from "./AnimatedSVGEdge";

import "@xyflow/react/dist/style.css";

export default function ReactFlowPoCPage() {
  const initialNodes = [
    { id: "1", position: { x: 600, y: 200 }, data: { label: "ENSNode" }, targetPosition: "left" },
    {
      id: "2",
      position: { x: 200, y: 200 },
      data: { label: "Some blockchain" },
      sourcePosition: "right",
    },
    { id: "3", position: { x: 400, y: 100 }, data: { label: "Some other blockchain" } },
  ];

  const edgeTypes = {
    animatedSvg: AnimatedSVGEdge,
  };

  const initialEdges = [
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

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  setNodes(initialNodes);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "animatedSvg",
            style: {
              strokeWidth: 1,
              stroke: "#05eeff",
            },
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
    <>
      <h1 className="text-center font-bold leading-7 text-4xl p-2">React-Flow PoC</h1>
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
    </>
  );
}
