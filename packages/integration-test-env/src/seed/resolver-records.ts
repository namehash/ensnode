import { type Address, type Hex, namehash, toHex } from "viem";
import { packetToBytes } from "viem/ens";

import { ResolverABI, UniversalResolverABI } from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";

import { addresses, fixtures } from "../devnet/fixtures";
import type { DevnetWalletClient, DevnetWalletClients } from "./index";
import { waitForTransactionReceipt } from "./index";

export async function seedResolverRecords(clients: DevnetWalletClients): Promise<void> {
  await seedResolverRecordsForName(clients, "test.eth", contracts.PermissionedResolver);
}

async function seedResolverRecordsForName(
  clients: DevnetWalletClients,
  name: string,
  resolver: Address,
): Promise<void> {
  const node = namehash(name);
  const actualResolver = await findResolver(clients.owner, name);
  if (actualResolver.toLowerCase() !== resolver.toLowerCase()) {
    throw new Error(
      `${name} resolver mismatch: active=${actualResolver}, expected=${resolver}. Either resolver has been changed or something else is wrong.`,
    );
  }

  for (const record of Object.values(fixtures.textRecords)) {
    await setTextRecord(clients.owner, resolver, node, record.key, record.value);
  }

  // Multi-coin addresses
  for (const coin of Object.values(fixtures.rawAddresses)) {
    await setMulticoinAddress(clients.owner, resolver, node, BigInt(coin.coinType), coin.raw);
  }

  // Scalar resolver records
  await setContenthash(clients.owner, resolver, node, fixtures.contenthash);
  await setPubkey(clients.owner, resolver, node, fixtures.publicKeyX, fixtures.publicKeyY);
  await setAbi(clients.owner, resolver, node, 1n, fixtures.abiBytes);
  await setInterfaceImplementer(
    clients.owner,
    resolver,
    node,
    fixtures.fourBytesInterface,
    addresses.one,
  );
}

async function findResolver(client: DevnetWalletClient, name: string): Promise<Address> {
  const [resolver] = await client.readContract({
    address: contracts.UniversalResolverV2,
    abi: UniversalResolverABI,
    functionName: "findResolver",
    args: [toHex(packetToBytes(name))],
  });
  return resolver;
}

async function setTextRecord(
  walletClient: DevnetWalletClient,
  resolver: Address,
  node: Hex,
  key: string,
  value: string,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: resolver,
    abi: ResolverABI,
    functionName: "setText",
    args: [node, key, value],
  });
  await waitForTransactionReceipt(walletClient, hash);
  console.log(`[seed] setText("${key}", "${value}") tx: ${hash}`);
}

async function setMulticoinAddress(
  walletClient: DevnetWalletClient,
  resolver: Address,
  node: Hex,
  coinType: bigint,
  addressBytes: Hex,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: resolver,
    abi: ResolverABI,
    functionName: "setAddr",
    args: [node, coinType, addressBytes],
  });
  await waitForTransactionReceipt(walletClient, hash);
  console.log(`[seed] setAddr(coinType=${coinType}) tx: ${hash}`);
}

async function setContenthash(
  walletClient: DevnetWalletClient,
  resolver: Address,
  node: Hex,
  hashValue: Hex,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: resolver,
    abi: ResolverABI,
    functionName: "setContenthash",
    args: [node, hashValue],
  });
  await waitForTransactionReceipt(walletClient, hash);
  console.log(`[seed] setContenthash() tx: ${hash}`);
}

async function setPubkey(
  walletClient: DevnetWalletClient,
  resolver: Address,
  node: Hex,
  x: Hex,
  y: Hex,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: resolver,
    abi: ResolverABI,
    functionName: "setPubkey",
    args: [node, x, y],
  });
  await waitForTransactionReceipt(walletClient, hash);
  console.log(`[seed] setPubkey() tx: ${hash}`);
}

async function setAbi(
  walletClient: DevnetWalletClient,
  resolver: Address,
  node: Hex,
  contentType: bigint,
  data: Hex,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: resolver,
    abi: ResolverABI,
    functionName: "setABI",
    args: [node, contentType, data],
  });
  await waitForTransactionReceipt(walletClient, hash);
  console.log(`[seed] setABI(contentType=${contentType}) tx: ${hash}`);
}

async function setInterfaceImplementer(
  walletClient: DevnetWalletClient,
  resolver: Address,
  node: Hex,
  interfaceId: Hex,
  implementer: Address,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: resolver,
    abi: ResolverABI,
    functionName: "setInterface",
    args: [node, interfaceId, implementer],
  });
  await waitForTransactionReceipt(walletClient, hash);
  console.log(`[seed] setInterface(interfaceId=${interfaceId}) tx: ${hash}`);
}
