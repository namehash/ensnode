import type { Address, Hex } from "viem";
import { namehash, toHex } from "viem";
import { packetToBytes } from "viem/ens";

import { ResolverABI, UniversalResolverABI } from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";

import { waitForTransactionReceipt } from "../tx-receipts";
import type { DevnetWalletClient } from "../types";

export function getResolverAndNode(
  name: string,
  resolverAddress?: Hex,
): { node: Hex; resolver: Address } {
  return {
    node: namehash(name),
    resolver: (resolverAddress ?? contracts.permissionedResolver) as Address,
  };
}

export async function assertExpectedResolver(
  client: DevnetWalletClient,
  name: string,
  expectedResolver: Address,
): Promise<void> {
  const [actualResolver] = await client.readContract({
    address: contracts.universalResolverV2,
    abi: UniversalResolverABI,
    functionName: "findResolver",
    args: [toHex(packetToBytes(name))],
  });

  if (actualResolver.toLowerCase() !== expectedResolver.toLowerCase()) {
    throw new Error(
      `${name} resolver mismatch: active=${actualResolver}, expected=${expectedResolver}.`,
    );
  }
}

export async function writeResolverTx(
  client: DevnetWalletClient,
  args: {
    resolver: Address;
    functionName:
      | "setText"
      | "setAddr"
      | "setContenthash"
      | "setPubkey"
      | "setABI"
      | "setInterface";
    data: unknown[];
    log: string;
  },
): Promise<void> {
  const hash = await client.writeContract({
    address: args.resolver,
    abi: ResolverABI,
    functionName: args.functionName,
    args: args.data as never,
  });
  await waitForTransactionReceipt(client, hash);
  console.log(`[seed] ${args.log} tx=${hash}`);
}
