import type { Abi } from "viem";

// function multicall(bytes[] calldata data) external view returns (bytes[] memory);
export const IMulticallable = [
  {
    type: "function",
    name: "multicall",
    stateMutability: "view",
    inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
    outputs: [{ internalType: "bytes[]", name: "", type: "bytes[]" }],
  },
] as const satisfies Abi;
