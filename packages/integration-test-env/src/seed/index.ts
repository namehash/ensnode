import {
  type Account,
  type Chain,
  createWalletClient,
  http,
  type PublicActions,
  publicActions,
  type Transport,
  type WalletClient,
} from "viem";

import { ensTestEnvChain } from "@ensnode/datasources";
import { accounts } from "@ensnode/datasources/devnet";

import { seedPrimaryNameRecords } from "./primary-names";
import { seedResolverRecords } from "./resolver-records";

function createDevnetWalletClient(transport: Transport, account: Account) {
  return createWalletClient({
    chain: ensTestEnvChain,
    transport,
    account,
  }).extend(publicActions);
}

export type DevnetWalletClient = WalletClient<Transport, Chain, Account> & PublicActions;

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

export async function seedDevnet(rpcUrl: string): Promise<void> {
  const clients = createDevnetWalletClients(rpcUrl);
  await seedPrimaryNameRecords(clients);
  await seedResolverRecords(clients);
}
