/**
 * This file temporarily located here for prototyping—should be moved to ensnode-utils.
 */

import { Context, Event } from "ponder:registry";
import schema from "ponder:schema";
import { eq } from "ponder";
import { keccak256, toBytes } from "viem";

const LABEL_HASH_MASK = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000n;

// Utility functions
export function createEventId(event: Event): string {
  return [event.block.number, event.log.logIndex].join("-");
}

export function generateTokenId(label: string): string {
  const hash = keccak256(toBytes(label));

  // Convert the hash to BigInt and perform the bitwise operation
  const hashBigInt = BigInt(hash);
  const mask = BigInt(0x7);
  const tokenId = hashBigInt & ~mask; // Equivalent to & ~0x7
  console.log("generateTokenId", label, hash, tokenId);
  return tokenId.toString();
}

export function createDomainId(registryId: string | undefined, tokenId: string): string {
  return `${registryId}-${tokenId}`;
}

export async function updateDomainLabel(
  context: Context,
  domainId: string,
  label: string,
  tokenId: string,
  timestamp: bigint,
  event: any,
  source: string,
) {
  const domainRecord = await context.db.find(schema.v2_domain, { id: domainId });
  if (!domainRecord) {
    console.log("Domain not found:", domainId);
    return;
  }

  console.log("Updating domain label:", domainRecord);

  // Update registry database if exists
  const labelHash = BigInt(tokenId) & LABEL_HASH_MASK;
  const registryRecord = await context.db.sql.query.v2_registry.findFirst({
    where: eq(schema.v2_registry.labelHash, labelHash.toString()),
  });

  if (registryRecord) {
    console.log("Registry record found:", registryRecord);
    await context.db
      .update(schema.v2_registry, { id: registryRecord.id })
      .set({ ...registryRecord, label: label });
  }
  let name = label;
  if (source != "RootRegistry") {
    let currentRegistryId = registryRecord!.id;
    let currentName = name;

    while (true) {
      const parentRegistryRecord = await context.db.sql.query.v2_registry.findFirst({
        where: eq(schema.v2_registry.subregistryId, currentRegistryId),
      });

      if (!parentRegistryRecord) {
        break; // We've reached the top level
      }

      console.log("Parent registry record found:", parentRegistryRecord);
      let parentDomainRecord = await context.db.sql.query.v2_domain.findFirst({
        where: eq(schema.v2_domain.registry, parentRegistryRecord.id),
      });

      if (!parentDomainRecord) break;

      console.log("Parent domain record found:", parentDomainRecord);

      if (parentDomainRecord.isTld) {
        currentName = currentName + "." + parentDomainRecord.label;
        console.log("Reached TLD. Final name:", currentName);
        break;
      }

      currentName = currentName + "." + parentDomainRecord.label;
      currentRegistryId = parentRegistryRecord.id;
      console.log("Current name:", currentName);
    }

    name = currentName;
  }
  // Update the domain record
  const nameArray = domainRecord.name ? [...domainRecord.name, name] : [name];
  const newDomainRecord = {
    ...domainRecord,
    label: label,
    name: nameArray,
    labelHash: tokenId,
    isTld: source === "RootRegistry" ? true : false,
    updatedAt: timestamp,
  };

  await context.db.update(schema.v2_domain, { id: domainId }).set(newDomainRecord);

  // Store the event data
  const eventId = createEventId(event);
  await context.db.insert(schema.v2_newSubnameEvent).values({
    id: eventId,
    registryId: domainRecord.registry,
    label: label,
    labelHash: tokenId,
    source: source,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  console.log("Domain updated:", domainId);
}
