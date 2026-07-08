import type { Hex, TransactionReceipt } from "viem";
import {
  type Account,
  createWalletClient,
  http,
  publicActions,
  type Transport,
  testActions,
} from "viem";

import { ensTestEnvChain } from "@ensnode/datasources";

import { accounts } from "../devnet/fixtures";
import { seedEffectiveResolverFallback } from "./effective-resolver-fallback";
import { seedPrimaryNameRecords } from "./primary-names";
import { seedRegisteredNames } from "./registered-names";
import { seedResolverRecords } from "./resolver-records";

function createDevnetWalletClient(transport: Transport, account: Account) {
  return createWalletClient({
    chain: ensTestEnvChain,
    transport,
    account,
  })
    .extend(publicActions)
    .extend(testActions({ mode: "anvil" }));
}

export type DevnetWalletClient = ReturnType<typeof createDevnetWalletClient>;

export type DevnetWalletClients = {
  deployer: DevnetWalletClient; // index 0
  owner: DevnetWalletClient; // index 1
  user: DevnetWalletClient; // index 2
  user2: DevnetWalletClient; // index 3
};

function createDevnetWalletClients(rpcUrl: string): DevnetWalletClients {
  const transport = http(rpcUrl);
  const makeClient = (account: Account): DevnetWalletClient =>
    createDevnetWalletClient(transport, account);
  return {
    deployer: makeClient(accounts.deployer),
    owner: makeClient(accounts.owner),
    user: makeClient(accounts.user),
    user2: makeClient(accounts.user2),
  };
}

export const seedReceiptWaitOptions = {
  pollingInterval: 50,
  confirmations: 1,
  timeout: 15_000,
} as const;

export async function waitForTransactionReceipt(
  client: DevnetWalletClient,
  hash: Hex,
): Promise<TransactionReceipt> {
  return client.waitForTransactionReceipt({
    hash,
    ...seedReceiptWaitOptions,
  });
}

export async function seedDevnet(rpcUrl: string): Promise<void> {
  const clients = createDevnetWalletClients(rpcUrl);
  await seedPrimaryNameRecords(clients);
  await seedResolverRecords(clients);
  await seedEffectiveResolverFallback(clients);
  await seedRegisteredNames(clients);
}
