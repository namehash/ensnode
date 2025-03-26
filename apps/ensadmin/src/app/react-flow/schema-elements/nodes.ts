import type { Node } from "@xyflow/react";
import { Position } from "@xyflow/react";

const ENSAppNodes: Node[] = [
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
    position: { x: 80, y: 20 },
    style: {
      width: 60,
    },
    type: "input",
    parentId: "ENSApp",
    extent: "parent",
  },
  {
    id: "Finish",
    data: { label: "Finish" },
    position: { x: 300, y: 20 },
    style: {
      width: 60,
    },
    type: "output",
    targetPosition: Position.Bottom,
    parentId: "ENSApp",
    extent: "parent",
  },
];

const ENSClientNodes: Node[] = [
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
    data: { label: "Namehash" },
    position: { x: 80, y: 20 },
    style: {
      width: 80,
    },
    parentId: "ENSClient",
    extent: "parent",
  },
  {
    id: "OffDatLok",
    data: { label: "Offchain Data Lookup" },
    position: { x: 200, y: 20 },
    style: {
      width: 200,
    },
    parentId: "ENSClient",
    extent: "parent",
  },
];

const EthereumMainnetL1Nodes: Node[] = [
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
    position: { x: 80, y: 10 },
    style: {
      width: 80,
    },
    parentId: "EthereumMainnetL1",
    extent: "parent",
  },
  {
    id: "ENSReg",
    data: { label: "ENS Registry" },
    position: { x: 80, y: 300 },
    style: {
      width: 80,
    },
    parentId: "",
    extent: "parent",
  },
  {
    id: "RegRec",
    data: { label: "Registry Record" },
    position: { x: 80, y: 390 },
    style: {
      width: 80,
    },
    parentId: "",
    extent: "parent",
  },
  {
    id: "ResolverL1",
    data: { label: "Resolver" },
    position: { x: 80, y: 470 },
    style: {
      width: 400,
    },
    parentId: "",
    extent: "parent",
  },
];

const OffchainNodes: Node[] = [
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
    data: { label: "CCIP-Read Offchain Gateway" },
    position: { x: 150, y: 20 },
    style: {
      width: 200,
    },
    parentId: "Offchain",
    extent: "parent",
  },
];

const BaseL2Nodes: Node[] = [
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
    data: { label: "Resolver" },
    position: { x: 150, y: 20 },
    style: {
      width: 200,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    parentId: "BaseL2",
    extent: "parent",
  },
];

export const initialNodes: Node[] = [
  ...ENSAppNodes,
  ...ENSClientNodes,
  ...EthereumMainnetL1Nodes,
  ...OffchainNodes,
  ...BaseL2Nodes,
];
