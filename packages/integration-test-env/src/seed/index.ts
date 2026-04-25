import {
  type Account,
  type Chain,
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  publicActions,
  type Transport,
  type WalletClient,
} from "viem";

import { ensTestEnvChain } from "@ensnode/datasources";
import { DEVNET_ACCOUNTS } from "@ensnode/ensnode-sdk/internal";

import { seedPrimaryNameRecords } from "./primary-names";
import { seedResolverRecords } from "./resolver-records";

export type DevnetWalletClient = WalletClient<Transport, Chain, Account>;
export type DevnetReadClient = PublicClient<Transport, Chain>;

export type DevnetWalletClients = {
  deployer: DevnetWalletClient; // index 0
  owner: DevnetWalletClient; // index 1
  user: DevnetWalletClient; // index 2
  user2: DevnetWalletClient; // index 3
};

function createDevnetWalletClients(rpcUrl: string): DevnetWalletClients {
  const transport = http(rpcUrl);
  const makeClient = (account: Account) =>
    createWalletClient({
      chain: ensTestEnvChain,
      transport,
      account,
    }).extend(publicActions);
  return {
    deployer: makeClient(DEVNET_ACCOUNTS.deployer),
    owner: makeClient(DEVNET_ACCOUNTS.owner),
    user: makeClient(DEVNET_ACCOUNTS.user),
    user2: makeClient(DEVNET_ACCOUNTS.user2),
  };
}

export async function seedDevnet(rpcUrl: string): Promise<void> {
  const readClient = createPublicClient({
    chain: ensTestEnvChain,
    transport: http(rpcUrl),
  });
  const clients = createDevnetWalletClients(rpcUrl);
  await seedPrimaryNameRecords(clients);
  await seedResolverRecords(clients, readClient);
}
