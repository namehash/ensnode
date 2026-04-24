import {
  type Account,
  type Chain,
  createWalletClient,
  http,
  type Transport,
  type WalletClient,
} from "viem";
import { mnemonicToAccount } from "viem/accounts";

import { ensTestEnvChain } from "@ensnode/datasources";
import { DEVNET_MNEMONIC } from "@ensnode/ensnode-sdk/internal";

import { seedPrimaryNameRecords } from "./primary-names";

export type DevnetWalletClient = WalletClient<Transport, Chain, Account>;

export type DevnetWalletClients = {
  deployer: DevnetWalletClient; // index 0 — has REGISTRAR role on ETHRegistry
  owner: DevnetWalletClient; // index 1 — DEVNET_OWNER, owns test.eth
  user: DevnetWalletClient; // index 2 — DEVNET_USER
  user2: DevnetWalletClient; // index 3 — DEVNET_USER2
};

function createDevnetWalletClients(rpcUrl: string): DevnetWalletClients {
  const transport = http(rpcUrl);
  const mkClient = (addressIndex: number) =>
    createWalletClient({
      chain: ensTestEnvChain,
      transport,
      account: mnemonicToAccount(DEVNET_MNEMONIC, { addressIndex }),
    });
  return {
    deployer: mkClient(0),
    owner: mkClient(1),
    user: mkClient(2),
    user2: mkClient(3),
  };
}

export async function seedDevnet(rpcUrl: string): Promise<void> {
  const clients = createDevnetWalletClients(rpcUrl);
  await seedPrimaryNameRecords(clients);
}
