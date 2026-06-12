import type { Abi } from "viem";

/**
 * Minimal ABI for UserRegistry proxy initialization.
 * @see https://github.com/ensdomains/contracts-v2/blob/5677359db15edd8b7e2a7cda4798d801ab129c9d/contracts/src/registry/UserRegistry.sol
 */
export const UserRegistry = [
  {
    type: "function",
    name: "initialize",
    inputs: [
      { name: "admin", type: "address", internalType: "address" },
      { name: "roles", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const satisfies Abi;
