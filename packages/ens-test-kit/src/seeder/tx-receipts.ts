import type { Hex } from "viem";

import type { DevnetWalletClient } from "./types";

export const seedReceiptWaitOptions = {
  pollingInterval: 50,
  confirmations: 1,
  timeout: 15_000,
} as const;

export async function waitForTransactionReceipt(
  client: DevnetWalletClient,
  hash: Hex,
): Promise<void> {
  await client.waitForTransactionReceipt({
    hash,
    ...seedReceiptWaitOptions,
  });
}
