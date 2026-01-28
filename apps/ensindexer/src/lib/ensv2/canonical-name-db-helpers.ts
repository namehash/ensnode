import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import {
  constructSubInterpretedName,
  type DomainId,
  type ENSv1DomainId,
  type ENSv2DomainId,
  ensureInterpretedLabel,
  type LabelHash,
} from "@ensnode/ensnode-sdk";

/**
 * Materializes a Domain's Canonical Name given its `domainId`, its parent's `parentId`, and the
 * `labelHash` for its label.
 *
 * @param context
 * @param domainId
 * @param parentId
 * @param labelHash
 */
async function materializeCanonicalName(
  context: Context,
  domainId: DomainId,
  parentId: DomainId,
  labelHash: LabelHash,
) {
  const parentName = await context.db.find(schema.canonicalName, { domainId: parentId });
  const label = await context.db.find(schema.label, { labelHash });
  const interpretedLabel = ensureInterpretedLabel(labelHash, label?.value);

  const canonicalName = constructSubInterpretedName(interpretedLabel, parentName?.canonicalName);

  console.log(`${domainId}\n↳ ${canonicalName}`);

  await context.db
    .insert(schema.canonicalName)
    .values({ domainId, canonicalName })
    .onConflictDoUpdate({ canonicalName });
}

/**
 * Materializes an ENSv1 Domain's Name by resolving its (canonical) parent.
 */
export async function materializeENSv1CanonicalName(context: Context, domainId: ENSv1DomainId) {
  const domain = await context.db.find(schema.v1Domain, { id: domainId });
  if (!domain) {
    throw new Error(`Invariant(materializeENSv1CanonicalName): v1Domain '${domainId}' not found.`);
  }

  // materialize the canonical name
  await materializeCanonicalName(context, domainId, domain.parentId, domain.labelHash);
}

/**
 * Materializes an ENSv2 Domain's Name by resolving its canonical parent.
 */
export async function materializeENSv2CanonicalName(context: Context, domainId: ENSv2DomainId) {
  const domain = await context.db.find(schema.v2Domain, { id: domainId });
  if (!domain) {
    throw new Error(`Invariant(materializeENSv2CanonicalName): v2Domain '${domainId}' not found.`);
  }

  const registryCanonicalDomain = await context.db.find(schema.registryCanonicalDomain, {
    registryId: domain.registryId,
  });

  // if the registry doesn't declare a canonical name for this Domain there is no canonical name to materialize
  if (!registryCanonicalDomain) return;

  // materialize the canonical name
  await materializeCanonicalName(
    context,
    domainId,
    registryCanonicalDomain.domainId,
    domain.labelHash,
  );
}
