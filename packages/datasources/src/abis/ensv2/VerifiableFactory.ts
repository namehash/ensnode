import type { Abi } from "viem";

/**
 * Minimal ABI for the VerifiableFactory: a CREATE2 factory that deploys deterministic,
 * UUPS-compatible proxy clones. Each proxy's address is deterministic given the factory
 * address, the shared proxy logic, the caller, and a user-supplied salt.
 *
 * Used in the devnet seeding to deploy `UserRegistry` instances for custom 2LDs.
 *
 * @see https://github.com/ensdomains/verifiable-factory — contract source
 * @see https://github.com/ensdomains/contracts-v2/blob/main/contracts/script/setup.ts — usage in devnet setup
 */
export const VerifiableFactory = [
  {
    type: "function",
    name: "deployProxy",
    inputs: [
      { name: "implementation", type: "address", internalType: "address" },
      { name: "salt", type: "uint256", internalType: "uint256" },
      { name: "data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "ProxyDeployed",
    inputs: [
      { name: "sender", type: "address", indexed: true, internalType: "address" },
      { name: "proxyAddress", type: "address", indexed: true, internalType: "address" },
      { name: "salt", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "implementation", type: "address", indexed: false, internalType: "address" },
    ],
    anonymous: false,
  },
] as const satisfies Abi;
