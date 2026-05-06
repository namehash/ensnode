import config from "@/config";

import type { AccountId, DomainId, NormalizedAddress, RegistryId } from "enssdk";

import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Canonicality db helpers.
 *
 * Maintain the bidirectional invariant `Registry.canonicalDomainId` ↔ `Domain.canonicalSubregistryId`,
 * and a per-Registry list of child Domains in `registryDomains` so canonicality flips can walk
 * by primary keys to abide by Ponder's in-memory cache requirements and avoid a flush to Postgres.
 *
 * NOTE(child-list): we store the child set as a single `DomainId[]` keyed by `registryId` because
 * Ponder prefetches whole rows by PK, so the cascade reads the entire list in one round-trip.
 * For very-large registries (e.g. the steady-state `.eth` virtual registry), append rewrites the
 * full array per child — at sufficient N either:
 * a) a doubly-linked-list (one row per edge), or
 * b) eating the flush cost and using custom sql to CTE-walk-and-update the relevant domains
 * becomes the better trade. Revisit when necessary.
 */

/**
 * Idempotently link `domainId` into `registryId`'s child list and inherit `canonical` from the
 * Registry. If the Domain is already linked, no-op (the cascade in {@link updateRegistryCanonicality}
 * keeps existing children's `canonical` consistent).
 */
export async function ensureDomainInRegistry(
  context: IndexingEngineContext,
  registryId: RegistryId,
  domainId: DomainId,
): Promise<void> {
  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  if (!registry) {
    throw new Error(
      `Invariant(ensureDomainInRegistry): Registry '${registryId}' must exist before linking Domain '${domainId}'. Call ensureRegistry first.`,
    );
  }

  const existing = await context.ensDb.find(ensIndexerSchema.registryDomains, { registryId });
  if (existing?.domainIds.includes(domainId)) return;

  const domainIds = existing ? [...existing.domainIds, domainId] : [domainId];
  await context.ensDb
    .insert(ensIndexerSchema.registryDomains)
    .values({ registryId, domainIds })
    .onConflictDoUpdate({ domainIds });

  await context.ensDb
    .update(ensIndexerSchema.domain, { id: domainId })
    .set({ canonical: registry.canonical });
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
  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  if (!registry) {
    throw new Error(
      `Invariant(setRegistryCanonicalDomain): Registry '${registryId}' must exist before being canonicalized.`,
    );
  }

  const prevCanonicalDomainId = registry.canonicalDomainId ?? null;

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
  if (prevCanonicalDomainId === newCanonicalDomainId && registry.canonical === shouldBeCanonical) {
    return registry.canonical;
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

  if (registry.canonical !== shouldBeCanonical) {
    await updateRegistryCanonicality(context, registryId, shouldBeCanonical);
  }

  return shouldBeCanonical;
}

/**
 * Recursively flip `canonical` on `registryId` and every Domain in its child list (and their
 * canonical subtrees).
 *
 * The recursion is unbounded by design. ENS names have no formal depth limit, so a fixed cap
 * would abort indexing on legitimately deep namegraphs. Termination relies on the canonical
 * namegraph being a tree (each Registry has at most one canonical parent Domain, enforced by
 * the bidirectional invariant `Registry.canonicalDomainId` ↔ `Domain.canonicalSubregistryId`).
 * If that invariant is ever violated and a cycle is introduced, this function could recurse
 * indefinitely — that is an accepted trade-off for correctness on legitimately deep names.
 */
async function updateRegistryCanonicality(
  context: IndexingEngineContext,
  registryId: RegistryId,
  canonical: boolean,
): Promise<void> {
  await context.ensDb.update(ensIndexerSchema.registry, { id: registryId }).set({ canonical });

  const children = await context.ensDb.find(ensIndexerSchema.registryDomains, { registryId });
  if (!children) return;

  for (const domainId of children.domainIds) {
    // Read child once to capture its `canonicalSubregistryId` for the recursion (the field is
    // independent of the `canonical` flag we're about to write, so a single PK read suffices).
    const child = await context.ensDb.find(ensIndexerSchema.domain, { id: domainId });
    await context.ensDb.update(ensIndexerSchema.domain, { id: domainId }).set({ canonical });

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
 * Reads the PREVIOUS resolver from the Domain-Resolver Relation. This requires that this helper
 * runs BEFORE Protocol Acceleration's NewResolver/ResolverUpdated handlers, which overwrite the
 * DRR row — see `apps/ensindexer/ponder/src/register-handlers.ts` for the ordering.
 */
export async function handleBridgedResolverChange(
  context: IndexingEngineContext,
  registry: AccountId,
  domainId: DomainId,
  nextResolver: NormalizedAddress,
): Promise<void> {
  const prev = await context.ensDb.find(ensIndexerSchema.domainResolverRelation, {
    chainId: registry.chainId,
    address: registry.address,
    domainId,
  });

  const prevBridged = prev
    ? isBridgedResolver(config.namespace, { chainId: prev.chainId, address: prev.resolver })
    : null;

  const nextBridge = isBridgedResolver(config.namespace, {
    chainId: context.chain.id,
    address: nextResolver,
  });

  // we need to unset the previous bridged resolver's target registry's canonical domain if:
  const needsUnset =
    prevBridged && // it was previously bridged AND
    (!nextBridge || // we're unsetting the resolver entirely OR
      prevBridged.registryId !== nextBridge.registryId); // we're setting it and it's being changed

  if (needsUnset) {
    await setRegistryCanonicalDomain(context, prevBridged.registryId, null);
  }

  // if the new resolver is a Bridged Resolver, set the target registry's canonical domain
  if (nextBridge) {
    // NOTE: this function doesn't ensureRegistry() for the target, so if the event setting a
    // Bridged Resolver occurs before the target Registry exists (which does not occur for our existing
    // Bridged Resolvers) then this setRegistryCanonicalDomain will throw with the appropriate invariant
    await setRegistryCanonicalDomain(context, nextBridge.registryId, domainId);
  }
}
