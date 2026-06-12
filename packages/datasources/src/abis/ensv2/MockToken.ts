import type { Abi } from "viem";

/**
 * Minimal ABI for the devnet MockToken (MockUSDC / MockDAI) contracts.
 *
 * Only covers `mint`, which is not part of the standard ERC-20 ABI. All other ERC-20
 * operations (`approve`, `balanceOf`, `transfer`, etc.) are available via viem's built-in
 * `erc20Abi`.
 *
 * @see packages/datasources/src/devnet/constants.ts — `contracts.MockUSDC`, `contracts.MockDAI`
 */
export const MockToken = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const satisfies Abi;
