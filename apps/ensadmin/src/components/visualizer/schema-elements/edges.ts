import type { Edge } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";

export const initialEdges: Edge[] = [
  {
    id: "Start->Namehash",
    source: "Start",
    target: "Namehash",
    type: "start-end",
    data: {
      startLabel: "Resolve Address\njesse.base.eth",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    targetHandle: "StartInp",
    animated: true,
  },
  {
    id: "Namehash->UniRes",
    source: "Namehash",
    target: "UniRes",
    type: "start-end",
    data: {
      startLabel: "Resolve Address (node)",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    sourceHandle: "UniResOut",
    animated: true,
  },
  {
    id: "UniRes->ENSReg",
    source: "UniRes",
    target: "ENSReg",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    style: {
      stroke: "black",
    },
    animated: true,
  },
  {
    id: "ENSReg->RegRec",
    source: "ENSReg",
    target: "RegRec",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    style: {
      stroke: "black",
    },
    animated: true,
  },
  {
    id: "RegRec->ResolverL1",
    source: "RegRec",
    target: "ResolverL1",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    style: {
      stroke: "black",
    },
    targetHandle: "RegRecInp",
    animated: true,
  },
  {
    id: "OffDatLok->Finish",
    source: "OffDatLok",
    target: "Finish",
    type: "start-end",
    data: {
      startLabel: "Resolved Address 0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1",
      offsetY: -28,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    sourceHandle: "FinishOut",
    animated: true,
  },
  {
    id: "ResolverL1->OffDatLok",
    source: "ResolverL1",
    target: "OffDatLok",
    type: "start-end",
    data: {
      startLabel: "Revert OffchainLookup",
      offsetY: -35,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    sourceHandle: "OffDatLokOut1",
    targetHandle: "ResolverL1Inp1",
    animated: true,
  },
  {
    id: "ResolverL1->OffDatLok(2)",
    source: "ResolverL1",
    target: "OffDatLok",
    type: "start-end",
    data: {
      startLabel: "Return Data",
      offsetY: -35,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    sourceHandle: "OffDatLokOut2",
    targetHandle: "ResolverL1Inp2",
    animated: true,
  },
  {
    id: "OffDatLok->ResolverL1",
    source: "OffDatLok",
    target: "ResolverL1",
    type: "start-end",
    data: {
      startLabel: "Verify Offchain Data",
      offsetY: 35,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    targetHandle: "OffDatLokInp",
    sourceHandle: "ResolverL1Out",
    animated: true,
  },
  {
    id: "OffDatLok->CCIPRead",
    source: "OffDatLok",
    target: "CCIPRead",
    type: "start-end",
    data: {
      startLabel: "Ask Offchain Gateway",
      offsetY: 35,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    targetHandle: "OffDatLokInp",
    sourceHandle: "CCIPReadOut",
    animated: true,
  },
  {
    id: "CCIPRead->OffDatLok",
    source: "CCIPRead",
    target: "OffDatLok",
    type: "start-end",
    data: {
      startLabel: "Return Data",
      offsetY: -12,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    sourceHandle: "OffDatLokOut",
    targetHandle: "CCIPReadInp",
    animated: true,
  },
  {
    id: "CCIPRead->ResolverL2",
    source: "CCIPRead",
    target: "ResolverL2",
    type: "start-end",
    data: {
      startLabel: "Resolve Address (node)",
      offsetY: 8,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    sourceHandle: "ResolverL2Out",
    targetHandle: "CCIPReadInp",
    animated: true,
  },
  {
    id: "ResolverL2->CCIPRead",
    source: "ResolverL2",
    target: "CCIPRead",
    type: "start-end",
    data: {
      startLabel: "Resolved Address 0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1",
      offsetY: -10,
      offsetX: 0,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "black",
    },
    targetHandle: "ResolverL2Inp",
    sourceHandle: "CCIPReadOut",
    animated: true,
  },
];
