import type { Address, InterfaceId } from "enssdk";

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
 *
 * Accepts both viem PublicClient and Ponder Context client types.
 */
async function supportsInterface<
  TClient extends {
    readContract: (params: {
      abi: typeof EIP_165_ABI;
      functionName: "supportsInterface";
      address: Address;
      args: readonly [InterfaceId];
      // A `0x` ("returned no data") response to an eip-165 probe means "interface not
      // supported" — it is never transient. Ponder's `context.client` otherwise retries
      // empty-data responses 9× with exponential backoff (~64s each), which makes
      // index-time resolver classification pathologically slow. Opt out so it fails fast.
      // Plain viem clients ignore this field.
      retryEmptyResponse?: boolean;
    }) => Promise<boolean>;
  },
>({
  publicClient,
  interfaceId: selector,
  address,
}: {
  address: Address;
  interfaceId: InterfaceId;
  publicClient: TClient;
}) {
  try {
    return await publicClient.readContract({
      abi: EIP_165_ABI,
      functionName: "supportsInterface",
      address,
      args: [selector],
      retryEmptyResponse: false,
    });
  } catch {
    // this call reverted for whatever reason — this contract does not support the interface
    return false;
  }
}

export const makeSupportsInterfaceReader =
  (interfaceId: InterfaceId) =>
  (args: Omit<Parameters<typeof supportsInterface>[0], "interfaceId">) =>
    supportsInterface({
      ...args,
      interfaceId,
    });
