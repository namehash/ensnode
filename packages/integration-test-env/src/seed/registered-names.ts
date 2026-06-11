import { type Address, type Hex, namehash } from "viem";

import { RegistryABI } from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";

import type { NameRecords } from "../devnet/fixtures";
import { registeredNames } from "../devnet/fixtures";
import type { DevnetWalletClient, DevnetWalletClients } from "./index";
import { waitForTransactionReceipt } from "./index";
import { deployUserRegistry, registerEthName, registerSubname } from "./registrar";
import { setContenthash } from "./resolver-records";

/**
 * Seeds all resolver records for a single name node.
 * Extend this function when new record kinds are added to `NameRecords`.
 */
async function seedNameRecords(
  client: DevnetWalletClient,
  resolver: Address,
  node: Hex,
  records: NameRecords,
): Promise<void> {
  if (records.contenthash) {
    await setContenthash(client, resolver, node, records.contenthash);
  }
}

/**
 * Seed custom registered names into the devnet.
 *
 * For each entry in the `registeredNames` fixture:
 *  1. Deploy a UserRegistry (subregistry) for the 2LD via VerifiableFactory.
 *  2. Register the 2LD via the ETHRegistrar commit-reveal flow, wiring in the subregistry.
 *  3. Call setParent on the UserRegistry so the chain of canonical registries is complete.
 *  4. Seed resolver records on the 2LD.
 *  5. For each subname: register it into the UserRegistry and seed its records.
 */
export async function seedRegisteredNames(clients: DevnetWalletClients): Promise<void> {
  const client = clients.owner;
  const owner = client.account.address;
  const resolver = contracts.PermissionedResolver;

  for (const entry of registeredNames) {
    // 1. Deploy UserRegistry so we can pass it as the subregistry at registration time.
    const userRegistry = await deployUserRegistry(client, {
      name: entry.name,
      owner,
    });

    // 2. Register 2LD via ETHRegistrar commit-reveal, pointing at the fresh UserRegistry.
    await registerEthName(client, {
      label: entry.label,
      owner,
      resolver,
      subregistry: userRegistry,
    });

    // 3. Wire the canonical parent so findCanonicalRegistry/findCanonicalName work.
    const setParentHash = await client.writeContract({
      address: userRegistry,
      abi: RegistryABI,
      functionName: "setParent",
      args: [contracts.ETHRegistry, entry.label],
    });
    await waitForTransactionReceipt(client, setParentHash);
    console.log(`[seed] setParent("${entry.name}") tx: ${setParentHash}`);

    if (entry.records) {
      await seedNameRecords(client, resolver, namehash(entry.name) as Hex, entry.records);
    }

    // 5. Register subnames and seed their records.
    for (const sub of entry.subnames ?? []) {
      await registerSubname(client, userRegistry, {
        label: sub.label,
        owner,
        resolver,
      });

      if (sub.records) {
        await seedNameRecords(client, resolver, namehash(sub.name) as Hex, sub.records);
      }
    }
  }
}
