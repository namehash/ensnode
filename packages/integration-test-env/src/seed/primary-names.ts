import { L2ReverseRegistrarABI } from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";

import type { DevnetWalletClient, DevnetWalletClients } from "./index";

export async function seedPrimaryNameRecords(clients: DevnetWalletClients): Promise<void> {
  await setPrimaryNameRecord(clients.owner, "test.eth");
}

async function setPrimaryNameRecord(walletClient: DevnetWalletClient, name: string): Promise<void> {
  const hash = await walletClient.writeContract({
    address: contracts.ethReverseRegistrar,
    abi: L2ReverseRegistrarABI,
    functionName: "setName",
    args: [name],
  });
  await walletClient.waitForTransactionReceipt({ hash });
  console.log(`[seed] setPrimaryNameRecord("${name}") tx: ${hash}`);
}
