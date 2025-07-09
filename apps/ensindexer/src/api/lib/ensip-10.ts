import type { Address, PublicClient } from "viem";

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
 * ENSIP-10 Wildcard Resolution interface selector
 * @see https://docs.ens.domains/ensip/10
 */
const ENSIP10_SELECTOR = "0x9061b923";

/**
 * Determines whether a Resolver contract supports ENSIP-10.
 */
export async function supportsENSIP10Interface({
  publicClient,
  address,
}: {
  address: Address;
  publicClient: PublicClient;
}) {
  try {
    const supportsInterface = await publicClient.readContract({
      abi: EIP_165_ABI,
      functionName: "supportsInterface",
      address,
      args: [ENSIP10_SELECTOR],
    });

    return supportsInterface;
  } catch {
    // this call reverted for whatever reason — this contract does not support the interface
    return false;
  }
}
