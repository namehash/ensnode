import config from "@/config";

import type { AccountId, DomainId, NormalizedAddress, RegistryId } from "enssdk";

import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Canonicality db helpers.
 *
 * The two unidirectional pointers `Registry.canonicalDomainId` (Registry → Domain) and
 * `Domain.subregistryId` (Domain → Registry) are written blindly when their respective onchain
 * events fire. The bidirectional canonical edge is materialized — only when both pointers agree —
 * into the parallel `domainCanonicalSubregistry` table (`domainId` PK → `canonicalSubregistryId`).
 * That table is the single source of truth for "this Registry-Domain edge participates in the
 * canonical namegraph", and the cascade walks it to flip `Registry.canonical` / `Domain.canonical`.
 *
 * The parallel table is keyed by domain so the upward-walk SQL in ENSApi can JOIN on the
 * canonical subregistry from the registry side; an index on `canonicalSubregistryId` covers that
 * non-PK direction.
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
 * Set `registryId`'s canonical parent Domain (or unset if null) by writing the unidirectional
 * `Registry.canonicalDomainId` pointer, then reconciling the bidirectional materialization in
 * `domainCanonicalSubregistry` (and cascading canonicality) for both the previous and next edges.
 *
 * The new canonical Domain need not exist yet — `Registry.canonicalDomainId` is set blindly. The
 * `domainCanonicalSubregistry` row only materializes once `Domain.subregistryId` agrees, which
 * may happen later via `handleSubregistryUpdated`.
 */
export async function setRegistryCanonicalDomain(
  context: IndexingEngineContext,
  registryId: RegistryId,
  nextCanonicalDomainId: DomainId | null,
): Promise<void> {
  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  if (!registry) {
    throw new Error(
      `Invariant(setRegistryCanonicalDomain): Registry ${registryId} does not yet exist.`,
    );
  }

  // identify this Registry's Previous Canonical Domain
  const prevCanonicalDomainId = registry.canonicalDomainId ?? null;

  // if this Registry's Canonical Domain isn't changing, no-op (canonicality already consistent)
  if (prevCanonicalDomainId === nextCanonicalDomainId) return;

  // from here, we know that the Registry's Canonical parent Domain is changed...

  // set/unset this Registry's Canonical Domain
  // note that this is the uni-directional Registry->Domain link
  await context.ensDb
    .update(ensIndexerSchema.registry, { id: registryId })
    .set({ canonicalDomainId: nextCanonicalDomainId });

  // if previous Canonical Domain, ensure that its canonicality is materialized
  if (prevCanonicalDomainId) {
    await materializeAndCascade(context, registryId, prevCanonicalDomainId);
  }

  // materialize and cascade this registry's canonicality
  await materializeAndCascade(context, registryId, nextCanonicalDomainId);
}

async function materializeAndCascade(
  context: IndexingEngineContext,
  registryId: RegistryId,
  domainId: DomainId | null,
) {
  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  // if the Registry doesn't exist yet, no-op
  if (!registry) return;

  const domain = domainId
    ? await context.ensDb.find(ensIndexerSchema.domain, { id: domainId })
    : null;

  // iff `Registry → Domain` ↔ `Domain → Registry`, upsert the Domain's Canonical Subregistry;
  // otherwise, if a stale row for this exact (Domain, Registry) pair exists, clear it.
  // note that this is the materialized bi-directional Domain->Registry link (edge-authenticated)
  const registryPointsToDomain = registry.canonicalDomainId === domainId;
  const domainPointsToSubregistry = domain && domain.subregistryId === registryId;
  if (domainId) {
    if (registryPointsToDomain && domainPointsToSubregistry) {
      await context.ensDb
        .insert(ensIndexerSchema.domainCanonicalSubregistry)
        .values({ domainId, canonicalSubregistryId: registryId })
        .onConflictDoUpdate({ canonicalSubregistryId: registryId });
    } else {
      const existing = await context.ensDb.find(ensIndexerSchema.domainCanonicalSubregistry, {
        domainId,
      });
      // unset Domain's existing Canonical Subregistry iff it was pointing at _this_ Registry
      if (existing?.canonicalSubregistryId === registryId) {
        await context.ensDb.delete(ensIndexerSchema.domainCanonicalSubregistry, { domainId });
      }
    }
  }

  // Registry is Canonical iff Domain is Canonical
  const canonical = domain?.canonical ?? false;

  // cascade this Registry's canonicality
  await updateRegistryCanonicality(context, registryId, canonical);
}

/**
 * Recursively flip `canonical` on `registryId` and every Domain in its child list (and their
 * canonical subtrees).
 *
 * The recursion is unbounded by design. ENS names have no formal depth limit, so a fixed cap
 * would abort indexing on legitimately deep namegraphs. Termination relies on the canonical
 * namegraph being a tree (each Registry has at most one canonical parent Domain, enforced by
 * the bidirectional invariant materialized in `domainCanonicalSubregistry`). If that invariant
 * is ever violated and a cycle is introduced,
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

/**
 * Handles canonicality when a Domain updates its Subregistry.
 */
export async function handleSubregistryUpdated(
  context: IndexingEngineContext,
  domainId: DomainId,
  nextSubregistryId: RegistryId | null,
) {
  const domain = await context.ensDb.find(ensIndexerSchema.domain, { id: domainId });
  if (!domain) {
    throw new Error(`Invariant(handleSubregistryUpdated): Domain ${domainId} does not yet exist.`);
  }

  // if the Subregistry isn't changing, no-op
  const prevSubregistryId = domain.subregistryId;
  if (prevSubregistryId === nextSubregistryId) return;

  // set/unset the Domain's Subregistry
  // note that this is the uni-directional Domain->Registry link
  if (nextSubregistryId) {
    await context.ensDb
      .update(ensIndexerSchema.domain, { id: domainId })
      .set({ subregistryId: nextSubregistryId });
  } else {
    await context.ensDb
      .update(ensIndexerSchema.domain, { id: domainId })
      .set({ subregistryId: null });
  }

  // materialize and cascade canonicality for the previous and next subregistries
  if (prevSubregistryId) await materializeAndCascade(context, prevSubregistryId, domainId);
  if (nextSubregistryId) await materializeAndCascade(context, nextSubregistryId, domainId);
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
  nextResolver: NormalizedAddress | null,
): Promise<void> {
  const prev = await context.ensDb.find(ensIndexerSchema.domainResolverRelation, {
    chainId: registry.chainId,
    address: registry.address,
    domainId,
  });

  const prevResolver = prev?.resolver;

  const prevBridged = prevResolver
    ? isBridgedResolver(config.namespace, { chainId: registry.chainId, address: prevResolver })
    : null;

  const nextBridged = nextResolver
    ? isBridgedResolver(config.namespace, { chainId: registry.chainId, address: nextResolver })
    : null;

  // the previous and the next are identical, no-op
  if (prevBridged?.registryId === nextBridged?.registryId) return;

  // if the previous resolver was a Bridged Resolver, we need to disconnect both links
  if (prevBridged) {
    // update the Domain's Subregistry to null
    await handleSubregistryUpdated(context, domainId, null);

    // update the Registry's Canonical Domain to null
    // (which will also materialize and cascade canonicality)
    await setRegistryCanonicalDomain(context, prevBridged.registryId, null);
  }

  // if the next resolver is a Bridged Resolver, we need to connect all links
  if (nextBridged) {
    // update the Domain's Subregistry
    await handleSubregistryUpdated(context, domainId, nextBridged.registryId);

    // update the Registry's Canonical Domain
    // (which will also materialize and cascade canonicality)
    await setRegistryCanonicalDomain(context, nextBridged.registryId, domainId);
  }
}
