import { Address, Hex, PublicClient } from "viem";

/**
 * EIP-165 ABI
 * @see https://eips.ethereum.org/EIPS/eip-165
 */
const EIP_165_ABI = [
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceID",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Determines whether a Contract at `address` supports a specific EIP-165 `interfaceId`.
 */
export async function supportsInterface({
  publicClient,
  interfaceId: selector,
  address,
}: {
  address: Address;
  interfaceId: Hex;
  publicClient: PublicClient;
}) {
  try {
    return await publicClient.readContract({
      abi: EIP_165_ABI,
      functionName: "supportsInterface",
      address,
      args: [selector],
    });
  } catch {
    // this call reverted for whatever reason — this contract does not support the interface
    return false;
  }
}
