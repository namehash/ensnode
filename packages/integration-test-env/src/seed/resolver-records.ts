import { type Address, createPublicClient, type Hex, http, namehash, toHex } from "viem";
import { packetToBytes } from "viem/ens";

import { ensTestEnvChain } from "@ensnode/datasources";
import { DEVNET_ACCOUNTS, DEVNET_BYTES, DEVNET_CONTRACTS } from "@ensnode/ensnode-sdk/internal";

import { publicResolverAbi, universalResolverV2Abi } from "./abi";
import type { DevnetWalletClient, DevnetWalletClients } from "./index";

const RESOLVER = DEVNET_CONTRACTS.permissionedResolver;

export async function seedResolverRecords(clients: DevnetWalletClients): Promise<void> {
  const node = namehash("test.eth");
  await assertTestEthResolver(clients.owner.transport.url);

  // Text records
  await setTextRecord(clients.owner, node, "avatar", "https://example.com/avatar.png");
  await setTextRecord(clients.owner, node, "com.twitter", "ensdomains");
  await setTextRecord(clients.owner, node, "com.github", "ensdomains");
  await setTextRecord(clients.owner, node, "url", "https://ens.domains");
  await setTextRecord(clients.owner, node, "email", "test@ens.domains");
  await setTextRecord(clients.owner, node, "description", "test.eth");

  // Multi-coin addresses
  // Coin 0 = Bitcoin
  await setMulticoinAddress(clients.owner, node, 0n, DEVNET_BYTES.bitcoinAddress);
  // Coin 2 = Litecoin
  await setMulticoinAddress(clients.owner, node, 2n, DEVNET_BYTES.litecoinAddress);

  // Scalar resolver records
  await setContenthash(clients.owner, node, DEVNET_BYTES.contenthash);
  await setPubkey(clients.owner, node, DEVNET_BYTES.publicKeyX, DEVNET_BYTES.publicKeyY);
  await setAbi(clients.owner, node, 1n, DEVNET_BYTES.abiBytes);
  await setInterfaceImplementer(
    clients.owner,
    node,
    DEVNET_BYTES.fourBytesInterface,
    DEVNET_ACCOUNTS.one,
  );
}

async function assertTestEthResolver(rpcUrl: string): Promise<void> {
  const publicClient = createPublicClient({ chain: ensTestEnvChain, transport: http(rpcUrl) });
  const [activeResolver] = await publicClient.readContract({
    address: DEVNET_CONTRACTS.universalResolverV2,
    abi: universalResolverV2Abi,
    functionName: "findResolver",
    args: [toHex(packetToBytes("test.eth"))],
  });
  if (activeResolver.toLowerCase() !== RESOLVER.toLowerCase()) {
    throw new Error(`test.eth resolver mismatch: active=${activeResolver}, expected=${RESOLVER}`);
  }
}

async function setTextRecord(
  walletClient: DevnetWalletClient,
  node: Hex,
  key: string,
  value: string,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: RESOLVER,
    abi: publicResolverAbi,
    functionName: "setText",
    args: [node, key, value],
  });
  console.log(`[seed] setText("${key}", "${value}") tx: ${hash}`);
}

async function setMulticoinAddress(
  walletClient: DevnetWalletClient,
  node: Hex,
  coinType: bigint,
  addressBytes: Hex,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: RESOLVER,
    abi: publicResolverAbi,
    functionName: "setAddr",
    args: [node, coinType, addressBytes],
  });
  console.log(`[seed] setAddr(coinType=${coinType}) tx: ${hash}`);
}

async function setContenthash(
  walletClient: DevnetWalletClient,
  node: Hex,
  hashValue: Hex,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: RESOLVER,
    abi: publicResolverAbi,
    functionName: "setContenthash",
    args: [node, hashValue],
  });
  console.log(`[seed] setContenthash() tx: ${hash}`);
}

async function setPubkey(
  walletClient: DevnetWalletClient,
  node: Hex,
  x: Hex,
  y: Hex,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: RESOLVER,
    abi: publicResolverAbi,
    functionName: "setPubkey",
    args: [node, x, y],
  });
  console.log(`[seed] setPubkey() tx: ${hash}`);
}

async function setAbi(
  walletClient: DevnetWalletClient,
  node: Hex,
  contentType: bigint,
  data: Hex,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: RESOLVER,
    abi: publicResolverAbi,
    functionName: "setABI",
    args: [node, contentType, data],
  });
  console.log(`[seed] setABI(contentType=${contentType}) tx: ${hash}`);
}

async function setInterfaceImplementer(
  walletClient: DevnetWalletClient,
  node: Hex,
  interfaceId: Hex,
  implementer: Address,
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: RESOLVER,
    abi: publicResolverAbi,
    functionName: "setInterface",
    args: [node, interfaceId, implementer],
  });
  console.log(`[seed] setInterface(interfaceId=${interfaceId}) tx: ${hash}`);
}

// async function clearResolverRecords(walletClient: DevnetWalletClient, node: Hex): Promise<void> {
//   const hash = await walletClient.writeContract({
//     address: PUBLIC_RESOLVER,
//     abi: publicResolverAbi,
//     functionName: "clearRecords",
//     args: [node],
//   });
//   console.log(`[seed] clearRecords() tx: ${hash}`);
// }
