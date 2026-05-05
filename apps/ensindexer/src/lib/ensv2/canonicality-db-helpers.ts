import config from "@/config";

import type { DomainId, Node, NormalizedAddress, RegistryId } from "enssdk";

import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { ensureRegistry } from "@/lib/ensv2/registry-db-helpers";
import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Canonicality db helpers.
 *
 * Maintain the bidirectional invariant `Registry.canonicalDomainId` ↔ `Domain.canonicalSubregistryId`,
 * and a per-Registry list of child Domains in `registryDomains` so canonicality flips can walk
 * only the affected Registry's children rather than the global `domain` table.
 *
 * NOTE(child-list): we store the child set as a single `DomainId[]` keyed by `registryId` because
 * Ponder prefetches whole rows by PK, so the cascade reads the entire list in one round-trip.
 * For very-large registries (e.g. the steady-state `.eth` virtual registry), append rewrites the
 * full array per child — at sufficient N a doubly-linked-list (one row per edge) becomes the
 * better trade. Revisit when registry sizes warrant.
 */

/**
 * Idempotently link `domainId` into `registryId`'s child list and inherit `canonical` from the
 * Registry. If the Domain is already linked, no-op (the cascade in
 * {@link updateRegistryCanonicality} keeps existing children's `canonical` consistent).
 */
export async function ensureDomainInRegistry(
  context: IndexingEngineContext,
  registryId: RegistryId,
  domainId: DomainId,
): Promise<void> {
  const existing = await context.ensDb.find(ensIndexerSchema.registryDomains, { registryId });
  if (existing?.domainIds.includes(domainId)) return;

  const domainIds = existing ? [...existing.domainIds, domainId] : [domainId];
  await context.ensDb
    .insert(ensIndexerSchema.registryDomains)
    .values({ registryId, domainIds })
    .onConflictDoUpdate({ domainIds });

  const reg = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  await context.ensDb
    .update(ensIndexerSchema.domain, { id: domainId })
    .set({ canonical: reg?.canonical ?? false });
}

/**
 * Removes a Domain from a Registry's child list.
 */
export async function removeDomainFromRegistry(
  context: IndexingEngineContext,
  registryId: RegistryId,
  domainId: DomainId,
): Promise<void> {
  const existing = await context.ensDb.find(ensIndexerSchema.registryDomains, { registryId });
  if (!existing) return;

  const domainIds = existing.domainIds.filter((id) => id !== domainId);
  if (domainIds.length === existing.domainIds.length) return;

  if (domainIds.length === 0) {
    await context.ensDb.delete(ensIndexerSchema.registryDomains, { registryId });
  } else {
    await context.ensDb.update(ensIndexerSchema.registryDomains, { registryId }).set({ domainIds });
  }
}

/**
 * Set `registryId`'s canonical parent Domain (or unset if null), maintaining the bidirectional
 * invariant and cascading canonicality to the registry's subtree. Returns the resulting
 * `Registry.canonical`.
 */
export async function setRegistryCanonicalDomain(
  context: IndexingEngineContext,
  registryId: RegistryId,
  newCanonicalDomainId: DomainId | null,
): Promise<boolean> {
  const reg = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  if (!reg) {
    throw new Error(
      `Invariant(setRegistryCanonicalDomain): Registry '${registryId}' must exist before being canonicalized.`,
    );
  }

  const prevCanonicalDomainId = reg.canonicalDomainId ?? null;

  // Read the new canonical Domain once; reused for both dislodge and shouldBeCanonical.
  const newDomain = newCanonicalDomainId
    ? await context.ensDb.find(ensIndexerSchema.domain, { id: newCanonicalDomainId })
    : null;
  if (newCanonicalDomainId && !newDomain) {
    throw new Error(
      `Invariant(setRegistryCanonicalDomain): Domain '${newCanonicalDomainId}' must exist before being made canonical parent of '${registryId}'.`,
    );
  }

  // Idempotent fast-path: edge already wired and canonicality consistent.
  const shouldBeCanonical = newDomain?.canonical ?? false;
  if (prevCanonicalDomainId === newCanonicalDomainId && reg.canonical === shouldBeCanonical) {
    return reg.canonical;
  }

  if (prevCanonicalDomainId && prevCanonicalDomainId !== newCanonicalDomainId) {
    await context.ensDb
      .update(ensIndexerSchema.domain, { id: prevCanonicalDomainId })
      .set({ canonicalSubregistryId: null });
  }

  if (newDomain) {
    const prevRegistryUnderNewDomain = newDomain.canonicalSubregistryId ?? null;
    if (prevRegistryUnderNewDomain && prevRegistryUnderNewDomain !== registryId) {
      await context.ensDb
        .update(ensIndexerSchema.registry, { id: prevRegistryUnderNewDomain })
        .set({ canonicalDomainId: null });
      await updateRegistryCanonicality(context, prevRegistryUnderNewDomain, false);
    }
  }

  await context.ensDb
    .update(ensIndexerSchema.registry, { id: registryId })
    .set({ canonicalDomainId: newCanonicalDomainId });

  if (newCanonicalDomainId) {
    await context.ensDb
      .update(ensIndexerSchema.domain, { id: newCanonicalDomainId })
      .set({ canonicalSubregistryId: registryId });
  }

  if (reg.canonical !== shouldBeCanonical) {
    await updateRegistryCanonicality(context, registryId, shouldBeCanonical);
  }

  return shouldBeCanonical;
}

/**
 * Recursively flip `canonical` on `registryId` and every Domain in its child list (and their
 * canonical subtrees). The canonical namegraph is a tree (each Registry has at most one canonical
 * parent Domain, edge-authenticated by the bidirectional invariant), so no cycle guard is needed.
 */
export async function updateRegistryCanonicality(
  context: IndexingEngineContext,
  registryId: RegistryId,
  canonical: boolean,
): Promise<void> {
  await context.ensDb.update(ensIndexerSchema.registry, { id: registryId }).set({ canonical });

  const children = await context.ensDb.find(ensIndexerSchema.registryDomains, { registryId });
  if (!children) return;

  for (const domainId of children.domainIds) {
    await context.ensDb.update(ensIndexerSchema.domain, { id: domainId }).set({ canonical });

    const child = await context.ensDb.find(ensIndexerSchema.domain, { id: domainId });
    const childSubregistry = child?.canonicalSubregistryId ?? null;
    if (childSubregistry) {
      await updateRegistryCanonicality(context, childSubregistry, canonical);
    }
  }
}

/**
 * Reconciles the canonical edge for a Domain whose Resolver just changed. Detaches any prior
 * bridged target and attaches the new one (when the new resolver is a known Bridged Resolver).
 *
 * Runs after Protocol Acceleration's NewResolver/ResolverUpdated handlers, which have already
 * overwritten the Domain-Resolver Relation — so the prior bridged target is recovered from
 * `Domain.canonicalSubregistryId` (which only the bridged-attach path writes for ENSv1 originating
 * Domains) rather than the DRR.
 */
export async function handleBridgedResolverChange(
  context: IndexingEngineContext,
  domainId: DomainId,
  originatingNode: Node,
  newResolver: NormalizedAddress,
): Promise<void> {
  const next = isBridgedResolver(
    config.namespace,
    { chainId: context.chain.id, address: newResolver },
    originatingNode,
  );

  const domain = await context.ensDb.find(ensIndexerSchema.domain, { id: domainId });
  const prev: RegistryId | null = domain?.canonicalSubregistryId ?? null;

  if (prev && (!next || prev !== next.id)) {
    await setRegistryCanonicalDomain(context, prev, null);
  }

  if (next) {
    await ensureRegistry(context, next.id, {
      type: next.type,
      chainId: next.chainId,
      address: next.address,
      ...(next.type === "ENSv1VirtualRegistry" ? { node: next.node } : {}),
    });

    await setRegistryCanonicalDomain(context, next.id, domainId);
  }
}
