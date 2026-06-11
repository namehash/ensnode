import {
  type Address,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  type Hex,
  keccak256,
  namehash,
  parseEventLogs,
  stringToHex,
} from "viem";

import {
  ETHRegistrarABI,
  MockTokenABI,
  RegistryABI,
  UserRegistryABI,
  VerifiableFactoryABI,
} from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";

import type { DevnetWalletClient } from "./index";
import { waitForTransactionReceipt } from "./index";

/**
 * Role bitmap granting all roles on ENSv2 registry and resolver contracts.
 * @see https://github.com/ensdomains/contracts-v2/blob/main/contracts/script/deploy-constants.ts
 */
export const ROLES_ALL = 0x1111111111111111111111111111111111111111111111111111111111111111n;

/**
 * Maximum expiry value for ENSv2 names (2^64 - 1).
 * @see https://github.com/ensdomains/contracts-v2/blob/main/contracts/script/deploy-constants.ts
 */
export const MAX_EXPIRY = (1n << 64n) - 1n;

const DEFAULT_DURATION_DAYS = 28;
const ONE_DAY_SECONDS = 86400;

/**
 * Advance the Anvil devnet clock by `seconds` and mine one block.
 */
export async function advanceTime(
  client: DevnetWalletClient,
  { seconds = 1, blocks = 1 },
): Promise<void> {
  await client.mine({
    blocks,
    interval: seconds,
  });
}

/**
 * Compute the deterministic salt for a UserRegistry proxy deployed for the given ENS name.
 * Mirrors `computeUserRegistrySalt` from contracts-v2/script/setup.ts.
 */
function computeUserRegistrySalt(name: string, version = 0n): bigint {
  return BigInt(
    keccak256(
      encodeAbiParameters(
        [
          { name: "id", type: "bytes32" },
          { name: "node", type: "bytes32" },
          { name: "version", type: "uint256" },
        ],
        [keccak256(stringToHex("UserRegistry")), namehash(name), version],
      ),
    ),
  );
}

/**
 * Deploy a UserRegistry proxy via the devnet VerifiableFactory.
 * Returns the deployed proxy address.
 */
export async function deployUserRegistry(
  client: DevnetWalletClient,
  {
    name,
    owner,
    roles = ROLES_ALL,
  }: {
    name: string;
    owner: Address;
    roles?: bigint;
  },
): Promise<Address> {
  const salt = computeUserRegistrySalt(name);
  const initData = encodeFunctionData({
    abi: UserRegistryABI,
    functionName: "initialize",
    args: [owner, roles],
  });

  const hash = await client.writeContract({
    address: contracts.VerifiableFactory,
    abi: VerifiableFactoryABI,
    functionName: "deployProxy",
    args: [contracts.UserRegistryImpl, salt, initData],
  });
  const receipt = await waitForTransactionReceipt(client, hash);

  const [log] = parseEventLogs({
    abi: VerifiableFactoryABI,
    eventName: "ProxyDeployed",
    logs: receipt.logs,
  });
  const proxyAddress = log.args.proxyAddress;
  console.log(`[seed] deployUserRegistry("${name}") → ${proxyAddress} tx: ${hash}`);
  return proxyAddress;
}

/**
 * Register a `.eth` second-level name via the ETHRegistrar commit-reveal flow.
 *
 * Steps: makeCommitment → commit → advance time past MIN_COMMITMENT_AGE → mint/approve payment
 * token as needed → register.
 */
export async function registerEthName(
  client: DevnetWalletClient,
  {
    label,
    owner,
    resolver,
    subregistry,
    durationDays = DEFAULT_DURATION_DAYS,
  }: {
    label: string;
    owner: Address;
    resolver: Address;
    subregistry: Address;
    durationDays?: number;
  },
): Promise<void> {
  const duration = BigInt(durationDays * ONE_DAY_SECONDS);
  const paymentToken = contracts.MockUSDC;
  const referrer = "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;
  const secret = keccak256(stringToHex(`secret:${label}`)) as Hex;

  // Step 1: commit
  const commitment = await client.readContract({
    address: contracts.ETHRegistrar,
    abi: ETHRegistrarABI,
    functionName: "makeCommitment",
    args: [label, owner, secret, subregistry, resolver, duration, referrer],
  });

  const commitHash = await client.writeContract({
    address: contracts.ETHRegistrar,
    abi: ETHRegistrarABI,
    functionName: "commit",
    args: [commitment],
  });
  await waitForTransactionReceipt(client, commitHash);
  console.log(`[seed] commit("${label}.eth") tx: ${commitHash}`);

  // Step 2: advance time past MIN_COMMITMENT_AGE
  const minAge = await client.readContract({
    address: contracts.ETHRegistrar,
    abi: ETHRegistrarABI,
    functionName: "MIN_COMMITMENT_AGE",
  });
  await advanceTime(client, { seconds: Number(minAge) + 1 });

  // Step 3: calculate price and ensure payment token balance
  const [base, premium] = await client.readContract({
    address: contracts.ETHRegistrar,
    abi: ETHRegistrarABI,
    functionName: "rentPrice",
    args: [label, owner, duration, paymentToken],
  });
  const price = base + premium;

  const balance = await client.readContract({
    address: paymentToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  });

  if (balance < price) {
    const mintHash = await client.writeContract({
      address: paymentToken,
      abi: MockTokenABI,
      functionName: "mint",
      args: [owner, price - balance],
    });
    await waitForTransactionReceipt(client, mintHash);
  }

  const approveHash = await client.writeContract({
    address: paymentToken,
    abi: erc20Abi,
    functionName: "approve",
    args: [contracts.ETHRegistrar, price],
  });
  await waitForTransactionReceipt(client, approveHash);

  // Step 4: register
  const registerHash = await client.writeContract({
    address: contracts.ETHRegistrar,
    abi: ETHRegistrarABI,
    functionName: "register",
    args: [label, owner, secret, subregistry, resolver, duration, paymentToken, referrer],
  });
  await waitForTransactionReceipt(client, registerHash);
  console.log(`[seed] register("${label}.eth") tx: ${registerHash}`);
}

/**
 * Register a subname inside a UserRegistry.
 */
export async function registerSubname(
  client: DevnetWalletClient,
  registry: Address,
  {
    label,
    owner,
    resolver,
    expiry = MAX_EXPIRY,
  }: {
    label: string;
    owner: Address;
    resolver: Address;
    expiry?: bigint;
  },
): Promise<void> {
  const hash = await client.writeContract({
    address: registry,
    abi: RegistryABI,
    functionName: "register",
    args: [label, owner, "0x0000000000000000000000000000000000000000", resolver, ROLES_ALL, expiry],
  });
  await waitForTransactionReceipt(client, hash);
  console.log(`[seed] registerSubname("${label}") in registry ${registry} tx: ${hash}`);
}
