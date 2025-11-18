import type {
  Abi,
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  Hex,
  ReadContractParameters,
  ReadContractReturnType,
} from "viem";

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

// construct a restricted publicClient type that matches both viem#PublicClient and Ponder's Context['client']
type ReadContract = <
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "pure" | "view">,
  const args extends ContractFunctionArgs<abi, "pure" | "view", functionName>,
>(
  args: Omit<ReadContractParameters<abi, functionName, args>, "blockNumber" | "blockTag">,
) => Promise<ReadContractReturnType<abi, functionName, args>>;

/**
 * Determines whether a Contract at `address` supports a specific EIP-165 `interfaceId`.
 */
async function supportsInterface({
  publicClient,
  interfaceId: selector,
  address,
}: {
  address: Address;
  interfaceId: Hex;
  publicClient: { readContract: ReadContract };
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

export const makeSupportsInterfaceReader =
  (interfaceId: Hex) => (args: Omit<Parameters<typeof supportsInterface>[0], "interfaceId">) =>
    supportsInterface({
      ...args,
      interfaceId,
    });
