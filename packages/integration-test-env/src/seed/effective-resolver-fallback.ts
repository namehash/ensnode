import { isAddressEqual, zeroAddress } from "viem";

import { RegistryABI } from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";

import { effectiveResolverFallback } from "../devnet/fixtures";
import type { DevnetWalletClients } from "./index";
import { waitForTransactionReceipt } from "./index";

/**
 * Registers `noresolver.parent.eth` WITHOUT a Resolver under `parent.eth` (which has one), so its
 * _effective_ Resolver resolves — via ENSIP-10 fallback — to `parent.eth`'s Resolver. Exercises
 * `DomainResolver.effective` fallback in the Omnigraph API integration tests.
 */
export async function seedEffectiveResolverFallback(clients: DevnetWalletClients): Promise<void> {
  const { parentLabel, subnameLabel } = effectiveResolverFallback;
  const client = clients.owner;

  // resolve the parent's Subregistry (deployed during devnet bring-up, before seeding)
  const subregistry = await client.readContract({
    address: contracts.ETHRegistry,
    abi: RegistryABI,
    functionName: "getSubregistry",
    args: [parentLabel],
  });

  if (isAddressEqual(subregistry, zeroAddress)) {
    throw new Error(
      `[seed] expected ${parentLabel}.eth to have a Subregistry to register '${subnameLabel}' into.`,
    );
  }

  // register the subname with resolver=zeroAddress, so it owns no Resolver of its own.
  // NOTE: expiry must be <= the parent's expiry; the devnet registers 2LDs far enough out that 1 year fits.
  const block = await client.getBlock();
  const expiry = block.timestamp + 365n * 24n * 60n * 60n;

  const hash = await client.writeContract({
    address: subregistry,
    abi: RegistryABI,
    functionName: "register",
    args: [subnameLabel, client.account.address, zeroAddress, zeroAddress, 0n, expiry],
  });
  await waitForTransactionReceipt(client, hash);
  console.log(
    `[seed] registered ${subnameLabel}.${parentLabel}.eth without a Resolver tx: ${hash}`,
  );
}
