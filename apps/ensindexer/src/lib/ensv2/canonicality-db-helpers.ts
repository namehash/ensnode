import config from "@/config";

import type { AccountId, DomainId, NormalizedAddress, RegistryId } from "enssdk";

import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Canonicality db helpers.
 *
 * Maintain the bidirectional invariant `Registry → Domain` ↔ `Domain → Registry` for the
 * canonical edge, materialized in two parallel tables:
 *   - `registryCanonicalDomain`  (registryId PK → canonicalDomainId)
 *   - `domainCanonicalSubregistry` (domainId PK → canonicalSubregistryId)
 *
 * The edge is stored in parallel tables (rather than columns on `registry`/`domain`) so it can be
 * recorded before the Registry or Domain row exists. This is necessary because canonicality
 * events can fire before the corresponding entity has been observed onchain — e.g. an ENSv2
 * `ParentUpdated` arriving before the child Registry's first `LabelRegistered`, or a Bridged
 * Resolver attach naming a target Registry that hasn't been seen yet.
 *
 * The `Registry.canonical` / `Domain.canonical` boolean flags remain on those rows and are
 * updated by the cascade for entities that exist; entities created later inherit canonicality
 * via `ensureDomainInRegistry`'s read of the parent Registry's flag.
 *
 * A per-Registry list of child Domains in `registryDomains` lets canonicality flips walk by
 * primary keys, abiding by Ponder's in-memory cache requirements and avoiding a flush to
 * Postgres.
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
 * Registry.
 */
export async function ensureDomainInRegistry(
  context: IndexingEngineContext,
  registryId: RegistryId,
  domainId: DomainId,
): Promise<void> {
  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  if (!registry) {
    throw new Error(
      `Invariant(ensureDomainInRegistry): Registry '${registryId}' must exist before linking Domain '${domainId}'.`,
    );
  }

  const existing = await context.ensDb.find(ensIndexerSchema.registryDomains, { registryId });
  // if Domain is already a child of Registry, no-op
  if (existing?.domainIds.includes(domainId)) return;

  // append the new domainId
  const domainIds = existing ? [...existing.domainIds, domainId] : [domainId];
  await context.ensDb
    .insert(ensIndexerSchema.registryDomains)
    .values({ registryId, domainIds })
    .onConflictDoUpdate({ domainIds });

  // this Domain is Canonical if it is in a Canonical Registry
  await context.ensDb
    .update(ensIndexerSchema.domain, { id: domainId })
    .set({ canonical: registry.canonical });
}

/**
 * Set `registryId`'s canonical parent Domain (or unset if null), maintaining the bidirectional
 * invariant via the `registryCanonicalDomain` ↔ `domainCanonicalSubregistry` parallel tables and
 * cascading canonicality to the registry's subtree.
 *
 * The Registry and the new canonical Domain need not exist yet — the edge is recorded in the
 * parallel tables regardless. The `canonical` boolean cascade is applied only to rows that
 * already exist; rows created later inherit `canonical` through `ensureDomainInRegistry` /
 * `ensureRegistry`'s seeding of the flag.
 */
export async function setRegistryCanonicalDomain(
  context: IndexingEngineContext,
  registryId: RegistryId,
  nextCanonicalDomainId: DomainId | null,
): Promise<void> {
  // first, identfiy this Registry's Previous Canonical Domain
  const prevEdge = await context.ensDb.find(ensIndexerSchema.registryCanonicalDomain, {
    registryId,
  });
  const prevCanonicalDomainId = prevEdge?.canonicalDomainId ?? null;

  // if this Registry's Canonical Domain isn't changing, no-op (canonicality already consistent)
  if (prevCanonicalDomainId === nextCanonicalDomainId) return;

  // determine whether this Registry was previously Canonical
  // const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  // const prevCanonical = registry?.canonical ?? false;

  // fetch Domain if setting
  const domain = nextCanonicalDomainId
    ? await context.ensDb.find(ensIndexerSchema.domain, { id: nextCanonicalDomainId })
    : null;

  // determine whether this Registry should be Canonical by checking the parent Domain. If the
  // parent Domain doesn't exist yet, this Registry cannot (yet) be Canonical.
  const nextCanonical = domain?.canonical ?? false;

  // clear the previous Canonical Domain's Canonical Subregistry, since it is no longer
  // bidirectionally agreed upon (note that we maintain Domain.subregistryId, as that represents the
  // uni-directional Domain->Registry link)
  if (prevCanonicalDomainId) {
    await context.ensDb.delete(ensIndexerSchema.domainCanonicalSubregistry, {
      domainId: prevCanonicalDomainId,
    });
  }

  // set/unset this Registry's Canonical Domain
  // note that this is the uni-directional Registry->Domain link
  if (nextCanonicalDomainId) {
    await context.ensDb
      .insert(ensIndexerSchema.registryCanonicalDomain)
      .values({ registryId, canonicalDomainId: nextCanonicalDomainId })
      .onConflictDoUpdate({ canonicalDomainId: nextCanonicalDomainId });
  } else {
    await context.ensDb.delete(ensIndexerSchema.registryCanonicalDomain, { registryId });
  }

  // iff `Registry → Domain` ↔ `Domain → Registry`, upsert the Domain's Canonical Subregistry
  // note that this is the materialized bi-directional Domain->Registry link (edge-authenticated)
  const registryPointsToDomain = domain && nextCanonicalDomainId === domain.id;
  const domainPointsToSubregistry = domain && domain.subregistryId === registryId;
  if (registryPointsToDomain && domainPointsToSubregistry) {
    await context.ensDb
      .insert(ensIndexerSchema.domainCanonicalSubregistry)
      .values({ domainId: nextCanonicalDomainId, canonicalSubregistryId: registryId })
      .onConflictDoUpdate({ canonicalSubregistryId: registryId });
  }

  // Cascade this Registry's canonicality
  await updateRegistryCanonicality(context, registryId, nextCanonical);
}

/**
 * Recursively flip `canonical` on `registryId` and every Domain in its child list (and their
 * canonical subtrees).
 *
 * The recursion is unbounded by design. ENS names have no formal depth limit, so a fixed cap
 * would abort indexing on legitimately deep namegraphs. Termination relies on the canonical
 * namegraph being a tree (each Registry has at most one canonical parent Domain, enforced by
 * the bidirectional invariant maintained across `registryCanonicalDomain` ↔
 * `domainCanonicalSubregistry`). If that invariant is ever violated and a cycle is introduced,
 * this function could recurse indefinitely — that is an accepted trade-off for correctness on
 * legitimately deep names.
 */
async function updateRegistryCanonicality(
  context: IndexingEngineContext,
  registryId: RegistryId,
  canonical: boolean,
): Promise<void> {
  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });

  // if the Registry does not exist, no-op
  if (!registry) return;

  // if the Registry's canonicality is already consistent, no-op
  const prevCanonical = registry.canonical;
  if (prevCanonical === canonical) return;

  // otherwise, update its canonicality
  await context.ensDb.update(ensIndexerSchema.registry, { id: registryId }).set({ canonical });

  // and cascade through its children
  const children = await context.ensDb.find(ensIndexerSchema.registryDomains, { registryId });
  if (!children) return;

  for (const domainId of children.domainIds) {
    // Invariant: Domain is guaranteed to exist if its id is in ensIndexerSchema.registryDomains
    await context.ensDb.update(ensIndexerSchema.domain, { id: domainId }).set({ canonical });

    // retrieve the child Domain's (bi-directional) Canonical Subregistry
    const childEdge = await context.ensDb.find(ensIndexerSchema.domainCanonicalSubregistry, {
      domainId,
    });
    if (childEdge) {
      // if exists, cascade canonicality
      await updateRegistryCanonicality(context, childEdge.canonicalSubregistryId, canonical);
    }
  }
}

// shouldn't there be a handleSubregistryUpdate here that needs to
// check if `Registry → Domain` ↔ `Domain → Registry` and upsert the Domain's Canonical Subregistry
// and then cascade? that way events on the other side (ENSv2 SubregistryUpdated) reconcile canonicality as well
// and for ENSv1 maybe we don't need to do anything because the creation order is guaranteed?

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
    await setRegistryCanonicalDomain(context, nextBridge.registryId, domainId);
  }
}
