import { L2ReverseRegistrarABI } from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";

import type { ChainId, Hex, NormalizedName } from "../../types";
import { waitForTransactionReceipt } from "../tx-receipts";
import type { SeederContext } from "../types";
import { buildFixture, type FixtureArgs, type FixtureMeta } from "./base";
import { getSenderClient } from "./sender-client";

type ReverseNameFields = {
  address: Hex;
  chainId: ChainId;
  name: NormalizedName;
};

export type ReverseNameFixture = FixtureMeta<"reverseName"> & ReverseNameFields;

export function reverseName(
  args: FixtureArgs<"reverseName", ReverseNameFields>,
): ReverseNameFixture {
  return buildFixture("reverseName", args);
}

export async function applyReverseNameFixture(
  fixture: ReverseNameFixture,
  ctx: SeederContext,
): Promise<void> {
  const senderClient = getSenderClient(ctx, fixture.sender);
  const senderAddress = senderClient.account.address.toLowerCase();
  if (fixture.address.toLowerCase() !== senderAddress) {
    throw new Error(
      `Reverse-name fixture "${fixture.id}" targets ${fixture.address}, but selected sender is ${senderClient.account.address}.`,
    );
  }

  const hash = await senderClient.writeContract({
    address: contracts.ethReverseRegistrar,
    abi: L2ReverseRegistrarABI,
    functionName: "setName",
    args: [fixture.name],
  });

  await waitForTransactionReceipt(senderClient, hash);
  console.log(`[seed] reverse-name ${fixture.name} tx=${hash}`);
}
