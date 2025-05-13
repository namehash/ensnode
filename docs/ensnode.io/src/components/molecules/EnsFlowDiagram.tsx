import React, { useCallback } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  MarkerType,
  type FitViewOptions,
  Handle,
} from "reactflow";
import "reactflow/dist/style.css";

import ensadminLogoUrl from "../../assets/ENSAdmin.svg";
import ensindexerLogoUrl from "../../assets/ENSIndexer.svg";
import ensrainbowLogoUrl from "../../assets/ENSRainbow.svg";
import baseLogoUrl from "../../assets/base-logo.svg";
import ethereumLogoUrl from "../../assets/ethereum-logo.svg";
import lineaLogoUrl from "../../assets/linea-logo.svg";
import optimismLogoUrl from "../../assets/optimism-logo.svg";

const getGroupLabelStyle = (
  position: "top" | "bottom" = "top"
): React.CSSProperties => ({
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#fff",
  padding: "2px 10px",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: "4px",
  zIndex: 10,
  ...(position === "top" ? { top: "-25px" } : { bottom: "-25px" }),
});

const CustomGroupNode = ({
  data,
}: {
  data: { label: string; labelPosition?: "top" | "bottom" };
}) => (
  <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <div style={getGroupLabelStyle(data.labelPosition)}>{data.label}</div>
  </div>
);

const CustomIndexerNode = ({ data }: { data: { label: JSX.Element } }) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="indexer-target-top"
        style={{ background: "#555", width: "8px", height: "8px" }}
      />

      {data.label}

      <Handle
        type="source"
        position={Position.Bottom}
        id="idx-src-eth"
        style={{ left: "20%", background: "#555", width: "8px", height: "8px" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="idx-src-op"
        style={{ left: "40%", background: "#555", width: "8px", height: "8px" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="idx-src-base"
        style={{ left: "60%", background: "#555", width: "8px", height: "8px" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="idx-src-linea"
        style={{ left: "80%", background: "#555", width: "8px", height: "8px" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="idx-src-rainbow"
        style={{ background: "#555", width: "8px", height: "8px" }}
      />
    </>
  );
};

const initialNodes: Node[] = [
  {
    id: "ens-node-parent",
    type: "customGroup",
    data: { label: "ENS Node", labelPosition: "top" },
    position: { x: 100, y: 50 },
    style: {
      width: 500,
      height: 180,
      backgroundColor: "rgba(0, 128, 255, 0.1)",
      border: "1px solid #0080FF",
      borderRadius: "8px",
      padding: "10px",
    },
  },
  {
    id: "ens-indexer",
    type: "customIndexer",
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          ENS Indexer
          <br />
          <img
            src={ensindexerLogoUrl.src}
            alt="ENS Indexer Placeholder"
            style={{
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              width: "70px",
              height: "70px",
              marginTop: "10px",
            }}
          />
        </div>
      ),
    },
    position: { x: 175, y: 30 },
    parentNode: "ens-node-parent",
    extent: "parent",
    style: {
      width: 130,
      height: 130,
      backgroundColor: "#ADD8E6",
      margin: "10px",
    },
  },
  {
    id: "ens-admin",
    type: "default",
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          ENS Admin
          <br />
          <img
            src={ensadminLogoUrl.src}
            alt="ENS Admin Placeholder"
            style={{
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              width: "70px",
              height: "70px",
              marginTop: "10px",
            }}
          />
        </div>
      ),
    },
    position: { x: 20, y: 30 },
    parentNode: "ens-node-parent",
    extent: "parent",
    style: {
      width: 130,
      height: 130,
      backgroundColor: "#ADD8E6",
      margin: "10px",
    },
  },
  {
    id: "ens-rainbow",
    type: "default",
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          ENS Rainbow
          <br />
          <img
            src={ensrainbowLogoUrl.src}
            alt="ENS Rainbow Placeholder"
            style={{
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              width: "70px",
              height: "70px",
              marginTop: "10px",
            }}
          />
        </div>
      ),
    },
    position: { x: 330, y: 30 },
    parentNode: "ens-node-parent",
    extent: "parent",
    style: {
      width: 130,
      height: 130,
      backgroundColor: "#ADD8E6",
      margin: "10px",
    },
  },
  {
    id: "chain-nodes-parent",
    type: "customGroup",
    data: { label: "Blockchain Nodes", labelPosition: "bottom" },
    position: { x: 100, y: 350 },
    style: {
      width: 500,
      height: 200,
      backgroundColor: "rgba(0, 255, 128, 0.1)",
      border: "1px solid #00FF80",
      borderRadius: "8px",
      padding: "10px",
    },
  },
  {
    id: "ethereum-node",
    type: "default",
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          Ethereum Node
          <br />
          <img
            src={ethereumLogoUrl.src}
            alt="Ethereum Logo"
            style={{ width: "180px", height: "70px", marginTop: "5px" }}
          />
        </div>
      ),
    },
    position: { x: 15, y: 50 },
    parentNode: "chain-nodes-parent",
    extent: "parent",
    style: {
      width: 100,
      height: 130,
      backgroundColor: "#90EE90",
      margin: "5px",
    },
  },
  {
    id: "optimism-node",
    type: "default",
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          Optimism Node
          <br />
          <img
            src={optimismLogoUrl.src}
            alt="Optimism Logo"
            style={{ width: "180px", height: "70px", marginTop: "5px" }}
          />
        </div>
      ),
    },
    position: { x: 130, y: 50 },
    parentNode: "chain-nodes-parent",
    extent: "parent",
    style: {
      width: 100,
      height: 130,
      backgroundColor: "#90EE90",
      margin: "5px",
    },
  },
  {
    id: "base-node",
    type: "default",
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          Base Node
          <br />
          <img
            src={baseLogoUrl.src}
            alt="Base Logo"
            style={{ width: "140px", height: "110px", marginTop: "5px" }}
          />
        </div>
      ),
    },
    position: { x: 245, y: 50 },
    parentNode: "chain-nodes-parent",
    extent: "parent",
    style: {
      width: 100,
      height: 130,
      backgroundColor: "#90EE90",
      margin: "5px",
    },
  },
  {
    id: "linear-node",
    type: "default",
    data: {
      label: (
        <div style={{ textAlign: "center" }}>
          Linea Node
          <br />
          <img
            src={lineaLogoUrl.src}
            alt="Linea Logo"
            style={{ width: "180px", height: "110px", marginTop: "5px" }}
          />
        </div>
      ),
    },
    position: { x: 360, y: 50 },
    parentNode: "chain-nodes-parent",
    extent: "parent",
    style: {
      width: 100,
      height: 130,
      backgroundColor: "#90EE90",
      margin: "5px",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e-indexer-ethereum",
    source: "ens-indexer",
    sourceHandle: "idx-src-eth",
    target: "ethereum-node",
    markerEnd: { type: MarkerType.ArrowClosed },
    label: "subgraph",
    animated: true,
    style: { stroke: "#000", strokeWidth: 2 },
  },
  {
    id: "e-indexer-optimism",
    source: "ens-indexer",
    sourceHandle: "idx-src-op",
    target: "optimism-node",
    markerEnd: { type: MarkerType.ArrowClosed },
    label: "threedns",
    animated: true,
    style: { stroke: "#000", strokeWidth: 2 },
  },
  {
    id: "e-indexer-base",
    source: "ens-indexer",
    sourceHandle: "idx-src-base",
    target: "base-node",
    markerEnd: { type: MarkerType.ArrowClosed },
    label: "basenames",
    animated: true,
    style: { stroke: "#000", strokeWidth: 2 },
  },
  {
    id: "e-indexer-linear",
    source: "ens-indexer",
    sourceHandle: "idx-src-linea",
    target: "linear-node",
    markerEnd: { type: MarkerType.ArrowClosed },
    label: "lineanames",
    animated: true,
    style: { stroke: "#000", strokeWidth: 2 },
  },
  // {
  //   id: "e-indexer-rainbow",
  //   source: "ens-indexer",
  //   sourceHandle: "idx-src-rainbow",
  //   target: "ens-rainbow",
  //   markerEnd: { type: MarkerType.ArrowClosed },
  //   animated: true,
  //   style: { stroke: "#000", strokeWidth: 2 },
  // },
  // {
  //   id: "e-admin-indexer",
  //   source: "ens-admin",
  //   target: "ens-indexer",
  //   targetHandle: "indexer-target-top",
  //   markerEnd: { type: MarkerType.ArrowClosed },
  //   animated: true,
  //   style: { stroke: "#000", strokeWidth: 2 },
  // },
];

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

const nodeTypes = {
  customGroup: CustomGroupNode,
  customIndexer: CustomIndexerNode,
};

const EnsFlowDiagram: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: "100%", height: "600px", border: "1px solid #eee" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        nodesDraggable={true}
        nodesConnectable={true}
      ></ReactFlow>
    </div>
  );
};

export default EnsFlowDiagram;
