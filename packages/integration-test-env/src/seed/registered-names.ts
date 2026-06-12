import { type Address, type Hex, namehash, zeroAddress } from "viem";

import { RegistryABI } from "@ensnode/datasources";
import { contracts } from "@ensnode/datasources/devnet";

import type { NameRecords, RegisteredName } from "../devnet/fixtures";
import { additionallyRegisteredNames } from "../devnet/fixtures";
import type { DevnetWalletClient, DevnetWalletClients } from "./index";
import { waitForTransactionReceipt } from "./index";
import {
  deployUserRegistry,
  registerEthName,
  registerLegacyEthName,
  registerSubname,
  registerWrappedEthName,
} from "./registrar";
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
  if (records.contenthash !== undefined) {
    await setContenthash(client, resolver, node, records.contenthash);
  }
}

async function seedEnsV1Name(
  client: DevnetWalletClient,
  resolver: Address,
  entry: Extract<RegisteredName, { type: "ENSv1" }>,
): Promise<void> {
  const wrapped = entry.wrapped !== false;

  if (wrapped) {
    await registerWrappedEthName(client, { label: entry.label, resolver });
  } else {
    await registerLegacyEthName(client, { label: entry.label, resolver });
  }

  if (entry.records) {
    await seedNameRecords(client, resolver, namehash(entry.name) as Hex, entry.records);
  }
}

async function seedEnsV2Name(
  client: DevnetWalletClient,
  resolver: Address,
  entry: Extract<RegisteredName, { type: "ENSv2" }>,
): Promise<void> {
  if (entry.subnames && entry.subnames.length > 0) {
    // 1. Deploy UserRegistry so we can pass it as the subregistry at registration time.
    const userRegistry = await deployUserRegistry(client, { name: entry.name });

    // 2. Register 2LD via ETHRegistrar commit-reveal, pointing at the fresh UserRegistry.
    await registerEthName(client, { label: entry.label, resolver, subregistry: userRegistry });

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

    // 4. Register subnames and seed their records.
    for (const sub of entry.subnames) {
      await registerSubname(client, userRegistry, { label: sub.label, resolver });

      if (sub.records) {
        await seedNameRecords(client, resolver, namehash(sub.name) as Hex, sub.records);
      }
    }
  } else {
    // No subnames: register directly without a dedicated UserRegistry.
    await registerEthName(client, {
      label: entry.label,
      resolver,
      subregistry: zeroAddress,
    });

    if (entry.records) {
      await seedNameRecords(client, resolver, namehash(entry.name) as Hex, entry.records);
    }
  }
}

/**
 * Seed custom registered names into the devnet.
 *
 * ENSv1 names are registered via WrappedETHRegistrarController (healed, default) or
 * LegacyETHRegistrarController (unhealed).
 * ENSv2 names without subnames are registered directly with a zero subregistry (no UserRegistry).
 * ENSv2 names with subnames get a dedicated UserRegistry deployed first.
 */
export async function seedRegisteredNames(clients: DevnetWalletClients): Promise<void> {
  const client = clients.owner;
  const resolver = contracts.PermissionedResolver;

  for (const entry of additionallyRegisteredNames) {
    if (entry.type === "ENSv1") {
      await seedEnsV1Name(client, resolver, entry);
    } else if (entry.type === "ENSv2") {
      await seedEnsV2Name(client, resolver, entry);
    } else {
      throw new Error(`Unknown registration type: ${(entry as RegisteredName).type}`);
    }
  }
}
