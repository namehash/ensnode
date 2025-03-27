import type { Node } from "@xyflow/react";
import { Position } from "@xyflow/react";

export type NodeHandle = {
  x: number;
  y: number;
  position: Position;
  id?: string | null;
  width?: number;
  height?: number;
  type?: "source" | "target";
};

export const ENSAppNodes: Node[] = [
  {
    id: "ENSApp",
    data: { label: "ENS App" },
    position: { x: 0, y: 0 },
    style: {
      width: 500,
      height: 80,
    },
    type: "labeledGroupNode",
  },
  {
    id: "Start",
    data: { label: "Start" },
    position: { x: 95, y: 10 },
    style: {
      width: 50,
      height: 50,
      borderRadius: "50px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    type: "input",
    parentId: "ENSApp",
    extent: "parent",
  },
  {
    id: "Finish",
    data: { label: "Finish" },
    position: { x: 415, y: 10 },
    style: {
      width: 50,
      height: 50,
      borderRadius: "50px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    type: "output",
    targetPosition: Position.Bottom,
    parentId: "ENSApp",
    extent: "parent",
  },
];

export const ENSClientNodes: Node[] = [
  {
    id: "ENSClient",
    data: { label: "ENS Client" },
    position: { x: 0, y: 90 },
    style: {
      width: 500,
      height: 80,
    },
    type: "labeledGroupNode",
  },
  {
    id: "Namehash",
    data: {
      label: "Namehash",
      handles: [
        { x: 26, y: -5, position: Position.Top, id: "StartInp", type: "target" },
        { x: 45, y: 35, position: Position.Bottom, id: "UniResOut", type: "source" },
      ],
    },
    position: { x: 80, y: 20 },
    style: {
      width: 80,
      height: 40,
    },
    parentId: "ENSClient",
    extent: "parent",
    type: "parallelogramNode",
  },
  {
    id: "OffDatLok",
    data: {
      label: "Offchain Data Lookup",
      handles: [
        { x: 40, y: 0, position: Position.Bottom, id: "ResolverL1Inp1", type: "target" },
        { x: 180, y: 0, position: Position.Bottom, id: "CCIPReadInp", type: "target" },
        { x: 260, y: 0, position: Position.Bottom, id: "ResolverL1Inp2", type: "target" },
        { x: 110, y: 0, position: Position.Bottom, id: "CCIPReadOut", type: "source" },
        { x: 220, y: 0, position: Position.Bottom, id: "ResolverL1Out", type: "source" },
        { x: 260, y: 0, position: Position.Top, id: "FinishOut", type: "source" },
      ],
      style: "h-[40px]",
    },
    position: { x: 180, y: 20 },
    style: {
      width: 300,
    },
    parentId: "ENSClient",
    extent: "parent",
    type: "multipleHandlesNode",
  },
];

export const EthereumMainnetL1Nodes: Node[] = [
  {
    id: "EthereumMainnetL1",
    data: { label: "Ethereum Mainnet (L1) " },
    position: { x: 0, y: 180 },
    style: {
      width: 500,
      height: 350,
    },
    type: "labeledGroupNode",
  },
  {
    id: "UniRes",
    data: { label: "Universal Resolver" },
    position: { x: 80, y: 35 },
    style: {
      width: 80,
    },
    parentId: "EthereumMainnetL1",
    extent: "parent",
  },
  {
    id: "ENSReg",
    data: { label: "ENS Registry" },
    position: { x: 80, y: 120 },
    style: {
      width: 80,
    },
    parentId: "EthereumMainnetL1",
    extent: "parent",
  },
  {
    id: "RegRec",
    data: { label: "Registry Record" },
    position: { x: 80, y: 210 },
    style: {
      width: 80,
    },
    parentId: "EthereumMainnetL1",
    extent: "parent",
  },
  {
    id: "ResolverL1",
    data: {
      label: "Resolver",
      handles: [
        { x: 40, y: 0, position: Position.Top, id: "RegRecInp", type: "target" },
        { x: 320, y: 0, position: Position.Top, id: "OffDatLokInp", type: "target" },
        { x: 140, y: 0, position: Position.Top, id: "OffDatLokOut1", type: "source" },
        { x: 360, y: 0, position: Position.Top, id: "OffDatLokOut2", type: "source" },
      ],
      style: "items-start pl-[16px]",
    },
    position: { x: 80, y: 290 },
    style: {
      width: 400,
    },
    parentId: "EthereumMainnetL1",
    extent: "parent",
    type: "multipleHandlesNode",
  },
];

export const OffchainNodes: Node[] = [
  {
    id: "Offchain",
    data: { label: "Offchain" },
    position: { x: 0, y: 540 },
    style: {
      width: 500,
      height: 80,
    },
    type: "labeledGroupNode",
  },
  {
    id: "CCIPRead",
    data: {
      label: "CCIP-Read Offchain Gateway",
      handles: [
        { x: 140, y: 0, position: Position.Top, id: "OffDatLokInp", type: "target" },
        { x: 210, y: 0, position: Position.Bottom, id: "ResolverL2Inp", type: "target" },
        { x: 210, y: 0, position: Position.Top, id: "OffDatLokOut", type: "source" },
        { x: 40, y: 0, position: Position.Bottom, id: "ResolverL2Out", type: "source" },
      ],
    },
    type: "multipleHandlesNode",
    position: { x: 150, y: 20 },
    style: {
      width: 300,
    },
    parentId: "Offchain",
    extent: "parent",
  },
];

export const BaseL2Nodes: Node[] = [
  {
    id: "BaseL2",
    data: { label: "Base (L2)" },
    position: { x: 0, y: 630 },
    style: {
      width: 500,
      height: 80,
    },
    type: "labeledGroupNode",
  },
  {
    id: "ResolverL2",
    data: {
      label: "Resolver",
      handles: [
        { x: 40, y: 0, position: Position.Top, id: "CCIPReadInp", type: "target" },
        { x: 210, y: 0, position: Position.Top, id: "CCIPReadOut", type: "source" },
      ],
    },
    position: { x: 150, y: 20 },
    style: {
      width: 300,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    parentId: "BaseL2",
    extent: "parent",
    type: "multipleHandlesNode",
  },
];

export const initialNodes: Node[] = [
  ...ENSAppNodes,
  ...ENSClientNodes,
  ...EthereumMainnetL1Nodes,
  ...OffchainNodes,
  ...BaseL2Nodes,
];
