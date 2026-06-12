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
  zeroAddress,
  zeroHash,
} from "viem";

import {
  BaseRegistrarABI,
  ETHRegistrarABI,
  LegacyEthRegistrarControllerABI,
  MockTokenABI,
  NameWrapperABI,
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
    roles = ROLES_ALL,
  }: {
    name: string;
    roles?: bigint;
  },
): Promise<Address> {
  const owner = client.account.address;
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
  if (!log) {
    throw new Error(`ProxyDeployed event not found in transaction receipt for ${name}`);
  }
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
    resolver,
    subregistry,
    durationDays = DEFAULT_DURATION_DAYS,
  }: {
    label: string;
    resolver: Address;
    subregistry: Address;
    durationDays?: number;
  },
): Promise<void> {
  const owner = client.account.address;
  const duration = BigInt(durationDays * ONE_DAY_SECONDS);
  const paymentToken = contracts.MockUSDC;
  const referrer = zeroHash;
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
 * Register a `.eth` second-level name via the legacy ENSv1 ETHRegistrarController commit-reveal
 * flow. Payment is in ETH (native currency), not ERC-20.
 *
 * @see https://github.com/ensdomains/ens-contracts (LegacyETHRegistrarController)
 */
export async function registerLegacyEthName(
  client: DevnetWalletClient,
  {
    label,
    durationDays = DEFAULT_DURATION_DAYS,
  }: {
    label: string;
    durationDays?: number;
  },
): Promise<void> {
  const duration = BigInt(durationDays * ONE_DAY_SECONDS);
  const owner = client.account.address;
  const secret = keccak256(stringToHex(`secret:${label}`)) as Hex;

  // Step 1: commit
  const commitment = await client.readContract({
    address: contracts.LegacyETHRegistrarController,
    abi: LegacyEthRegistrarControllerABI,
    functionName: "makeCommitment",
    args: [label, owner, secret],
  });

  const commitHash = await client.writeContract({
    address: contracts.LegacyETHRegistrarController,
    abi: LegacyEthRegistrarControllerABI,
    functionName: "commit",
    args: [commitment],
  });
  await waitForTransactionReceipt(client, commitHash);
  console.log(`[seed] legacy commit("${label}.eth") tx: ${commitHash}`);

  // Step 2: advance time past minCommitmentAge
  const minAge = await client.readContract({
    address: contracts.LegacyETHRegistrarController,
    abi: LegacyEthRegistrarControllerABI,
    functionName: "minCommitmentAge",
  });
  await advanceTime(client, { seconds: Number(minAge) + 1 });

  // Step 3: get ETH price
  const price = await client.readContract({
    address: contracts.LegacyETHRegistrarController,
    abi: LegacyEthRegistrarControllerABI,
    functionName: "rentPrice",
    args: [label, duration],
  });

  // Step 4: register (payable with ETH)
  const registerHash = await client.writeContract({
    address: contracts.LegacyETHRegistrarController,
    abi: LegacyEthRegistrarControllerABI,
    functionName: "register",
    args: [label, owner, duration, secret],
    value: price,
  });
  await waitForTransactionReceipt(client, registerHash);
  console.log(`[seed] legacy register("${label}.eth") tx: ${registerHash}`);
}

/**
 * Wrap an already-registered `.eth` 2LD via NameWrapper.
 * NameWrapped emits the literal label, so the indexer heals the canonical name.
 */
export async function wrapEthName(
  client: DevnetWalletClient,
  {
    label,
    resolver = zeroAddress,
    ownerControlledFuses = 0,
  }: {
    label: string;
    resolver?: Address;
    ownerControlledFuses?: number;
  },
): Promise<void> {
  const owner = client.account.address;

  const approvalHash = await client.writeContract({
    address: contracts.BaseRegistrarImplementation,
    abi: BaseRegistrarABI,
    functionName: "setApprovalForAll",
    args: [contracts.NameWrapper, true],
  });
  await waitForTransactionReceipt(client, approvalHash);

  const wrapHash = await client.writeContract({
    address: contracts.NameWrapper,
    abi: NameWrapperABI,
    functionName: "wrapETH2LD",
    args: [label, owner, ownerControlledFuses, resolver],
  });
  await waitForTransactionReceipt(client, wrapHash);
  console.log(`[seed] wrapETH2LD("${label}.eth") tx: ${wrapHash}`);
}

/**
 * Register and wrap a `.eth` 2LD: legacy commit-reveal registration, then NameWrapper.wrapETH2LD.
 * Avoids WrappedETHRegistrarController, whose devnet deployment does not match the ens-contracts ABI.
 */
export async function registerWrappedEthName(
  client: DevnetWalletClient,
  {
    label,
    resolver = zeroAddress,
    durationDays = DEFAULT_DURATION_DAYS,
  }: {
    label: string;
    resolver?: Address;
    durationDays?: number;
  },
): Promise<void> {
  await registerLegacyEthName(client, { label, durationDays });
  await wrapEthName(client, { label, resolver });
}

/**
 * Register a subname inside a UserRegistry.
 */
export async function registerSubname(
  client: DevnetWalletClient,
  registry: Address,
  {
    label,
    resolver,
    expiry = MAX_EXPIRY,
  }: {
    label: string;
    resolver: Address;
    expiry?: bigint;
  },
): Promise<void> {
  const owner = client.account.address;
  const hash = await client.writeContract({
    address: registry,
    abi: RegistryABI,
    functionName: "register",
    args: [label, owner, "0x0000000000000000000000000000000000000000", resolver, ROLES_ALL, expiry],
  });
  await waitForTransactionReceipt(client, hash);
  console.log(`[seed] registerSubname("${label}") in registry ${registry} tx: ${hash}`);
}
