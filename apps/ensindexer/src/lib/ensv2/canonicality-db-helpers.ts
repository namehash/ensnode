import config from "@/config";

import { sql } from "drizzle-orm";
import type { AccountId, DomainId, NormalizedAddress, RegistryId } from "enssdk";

import { isRootRegistryId } from "@ensnode/ensnode-sdk";
import { isBridgedResolver } from "@ensnode/ensnode-sdk/internal";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Canonicality db helpers.
 *
 * v1 and v2 share a single canonicality definition: a Registry is canonical iff it can be traced
 * back to a Root Registry via canonical edges. A canonical edge between Registry R and parent
 * Domain D requires both unidirectional pointers to agree
 * (`R.canonicalDomainId = D.id` ↔ `D.subregistryId = R.id`) AND D itself to be canonical. Root
 * Registries (ENSv1 root, ENSv2 root) are canonical by definition and seeded as such at
 * `ensureRegistry` time.
 *
 * Concretely, this means a v1 Domain whose Bridged Resolver claims its sub-registry leaves its
 * v1 children non-canonical. Example: mainnet `linea.eth` has a Bridged Resolver pointing at the
 * Linea Registry. `bridge.linea.eth` exists on both mainnet (as a v1 child of mainnet's
 * `linea.eth` virtual registry) and Linea (as a child of the bridged Linea Registry); but
 * mainnet `linea.eth.subregistryId` points at the Linea Registry, not the mainnet v1 virtual
 * registry, so agreement fails for the v1 virtual registry — it stays non-canonical, and so do
 * its children. Only the Linea-side `bridge.linea.eth` (the resolution-visible one) is canonical.
 *
 * The unidirectional pointers `Registry.canonicalDomainId` and `Domain.subregistryId` are written
 * blindly when their onchain events fire. Edge authentication is done on-demand at query time.
 * The boolean flags `Registry.canonical` and `Domain.canonical` reflect membership in the canonical
 * namegraph for PK-keyed query-time access, and are kept up-to-date by reconciling during updates
 * to the uni-directional pointers.
 *
 * When `reconcileRegistryCanonicality` determines a Registry's flag actually flips, we cascade
 * the change through the canonical subgraph beneath it. Two paths:
 *   - If the Registry has no descendants (`Registry.__hasChildren = false`, the dominant case
 *     for fresh ENSv1 virtual registries on first wire-up), the cascade is a single-row flag
 *     flip done via an in-memory PK update. No raw SQL, no flush.
 *   - Otherwise, a single recursive-CTE batch UPDATE walks the canonical subgraph via the
 *     unidirectional pointers + inline agreement check, batch-updating every visited Registry
 *     and its child Domains. This goes through `context.ensDb.sql`, which forces a Ponder cache
 *     flush + invalidate. We accept that cost because it's bounded to Registries that have
 *     children AND whose canonicality actually flips — i.e. bridged-resolver attach/detach and
 *     ENSv2 reparenting on already-populated subtrees.
 *
 * `__hasChildren` is a synthetic monotonic sentinel on `Registry` (false → true on the first
 * child Domain registered under it; never reset). See `ensureDomainInRegistry` for where it is
 * flipped.
 */

/**
 * Idempotently inherit `canonical` on `domainId` from its parent `registryId`, and mark the
 * parent Registry as having children (`__hasChildren = true`).
 *
 * The parent Registry's `canonical` flag has already been reconciled via the bidirectional
 * pointer dance before any child Domain is registered under it (the parent Registry's
 * `handleRegistryCanonicalDomainUpdated` / `handleSubregistryUpdated` calls run earlier in the
 * same handler). So the new Domain trivially inherits the parent's current flag — no cascade
 * required, since a brand-new Domain has no children of its own.
 *
 * The `__hasChildren` write flips the parent Registry's sentinel from false to true on the
 * first child Domain ever registered under it. The sentinel is monotonic (Domain rows aren't
 * deleted and `domain.registryId` is set at creation and never mutated), so once flipped it
 * stays true forever. `cascadeCanonicality` reads it to skip the SQL flush when there are
 * provably no descendants to update.
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

  // inherit the parent Registry's current canonical flag
  await context.ensDb
    .update(ensIndexerSchema.domain, { id: domainId })
    .set({ canonical: registry.canonical });

  // flip the parent Registry's __hasChildren sentinel on the first child (idempotent thereafter)
  if (!registry.__hasChildren) {
    await context.ensDb
      .update(ensIndexerSchema.registry, { id: registryId })
      .set({ __hasChildren: true });
  }
}

/**
 * Set `registryId`'s canonical parent Domain (or unset if null) by writing the unidirectional
 * `Registry.canonicalDomainId` pointer, then reconciling canonicality for both the previous
 * edge (if any) and the next edge.
 *
 * The new canonical Domain need not exist yet — `Registry.canonicalDomainId` is set blindly. The
 * canonical edge becomes "real" only when `Domain.subregistryId` agrees, which may happen later
 * via `handleSubregistryUpdated`.
 */
export async function handleRegistryCanonicalDomainUpdated(
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

  const prevCanonicalDomainId = registry.canonicalDomainId ?? null;

  // if this Registry's Canonical Domain isn't changing, no-op
  if (prevCanonicalDomainId === nextCanonicalDomainId) return;

  // set/unset the Registry's Canonical Domain (uni-directional Registry → Domain link)
  await context.ensDb
    .update(ensIndexerSchema.registry, { id: registryId })
    .set({ canonicalDomainId: nextCanonicalDomainId });

  // the registry's pointer changed, so its canonical-edge agreement may have changed too —
  // reconcile the registry's flag (which cascades through its descendants if it flips)
  await reconcileRegistryCanonicality(context, registryId);
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

  const prevSubregistryId = domain.subregistryId;

  // if the Subregistry isn't changing, no-op
  if (prevSubregistryId === nextSubregistryId) return;

  // set/unset the Domain's Subregistry (uni-directional Domain → Registry link)
  await context.ensDb
    .update(ensIndexerSchema.domain, { id: domainId })
    .set({ subregistryId: nextSubregistryId });

  // both the previous and the next subregistry may have had their canonical-edge agreement
  // change (the previous lost an agreeing back-pointer; the next may have gained one), so
  // reconcile each
  if (prevSubregistryId) await reconcileRegistryCanonicality(context, prevSubregistryId);
  if (nextSubregistryId) await reconcileRegistryCanonicality(context, nextSubregistryId);
}

/**
 * Reconciles the canonical edge for a Domain whose Resolver just changed. Detaches any prior
 * bridged target and attaches the new one (when the new resolver is a known Bridged Resolver).
 *
 * Reads the previous resolver from the Domain-Resolver Relation. This requires that this helper
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
  // NOTE: this also covers the "neither are bridged resolvers" case (null === null)
  if (prevBridged?.registryId === nextBridged?.registryId) return;

  // if the previous resolver was a Bridged Resolver, we need to disconnect both links
  if (prevBridged) {
    await handleSubregistryUpdated(context, domainId, null);
    await handleRegistryCanonicalDomainUpdated(context, prevBridged.registryId, null);
  }

  // if the next resolver is a Bridged Resolver, we need to connect all links
  if (nextBridged) {
    await handleSubregistryUpdated(context, domainId, nextBridged.registryId);
    await handleRegistryCanonicalDomainUpdated(context, nextBridged.registryId, domainId);
  }
}

/**
 * Recompute `Registry.canonical` from its current canonical-edge agreement and, if the flag
 * flips, cascade the new value through the canonical subgraph beneath this Registry via a
 * single recursive-CTE batch UPDATE.
 *
 * Canonicality rule:
 *   - Root Registries (ENSv1 root, ENSv2 root) are canonical by axiom.
 *   - For any non-root Registry R, R.canonical iff
 *       ∃ Domain P:
 *         P.id = R.canonicalDomainId      // R points up to P
 *         AND P.subregistryId = R.id      // P points down to R (bidirectional agreement)
 *         AND P.canonical                 // P itself is in the canonical namegraph
 *
 * Termination of the cascade walk relies on the canonical subgraph being a tree: each Registry
 * has at most one canonical parent Domain (enforced by the bidirectional agreement check), so
 * the recursive CTE cannot revisit a node. If that invariant is ever violated and a cycle is
 * introduced, the CTE's `UNION` (not `UNION ALL`) prunes duplicates and termination is preserved.
 */
async function reconcileRegistryCanonicality(
  context: IndexingEngineContext,
  registryId: RegistryId,
): Promise<void> {
  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  if (!registry) return;

  // determine the new canonicality from the current pointer state
  let nextCanonical: boolean;
  if (isRootRegistryId(config.namespace, registryId)) {
    // root registries are canonical by axiom (no parent edge to derive canonicality from); guard
    // against any pointer-write event spuriously flipping the flag off
    nextCanonical = true;
  } else if (!registry.canonicalDomainId) {
    nextCanonical = false;
  } else {
    const parentDomain = await context.ensDb.find(ensIndexerSchema.domain, {
      id: registry.canonicalDomainId,
    });
    nextCanonical =
      parentDomain != null && parentDomain.subregistryId === registryId && parentDomain.canonical;
  }

  // if the canonicality flag isn't changing, no-op (no cascade, no flush)
  if (registry.canonical === nextCanonical) return;

  // the flag is flipping — cascade through the canonical subgraph (or short-circuit to an
  // in-memory single-row update if the start registry has no descendants).
  await cascadeCanonicality(context, registryId, nextCanonical, registry.__hasChildren);
}

/**
 * Walk the canonical subgraph rooted at `startRegistryId` and set `canonical = newValue` on
 * every Registry and Domain it visits.
 *
 * Optimistic short-circuit: if the start Registry's `__hasChildren` sentinel is false, we know
 * structurally that there are no descendant rows for the cascade to update (no Domain has
 * `registry_id = startRegistryId`, hence no descendant Registry can have an agreeing canonical
 * edge into it either). In that case we flip just the start Registry's flag via an in-memory
 * PK update — no raw SQL, no Ponder cache flush. This is the dominant case for fresh ENSv1
 * virtual registries on first wire-up.
 *
 * Otherwise we issue a single SQL statement: one recursive CTE that enumerates the canonical
 * subgraph by following unidirectional pointers + agreement check, then two data-modifying CTEs
 * that batch-update Registries and their child Domains. The walk visits exactly the rows whose
 * canonicality flag must flip (the `IS DISTINCT FROM` filter skips rows already at the target
 * value, which matters for the start registry — its flag is set in the same statement — and
 * for any descendants that happen to already be consistent).
 */
async function cascadeCanonicality(
  context: IndexingEngineContext,
  startRegistryId: RegistryId,
  newValue: boolean,
  startHasChildren: boolean,
): Promise<void> {
  if (!startHasChildren) {
    // no descendants → cascade is a single-row flag flip; do it in-memory
    await context.ensDb
      .update(ensIndexerSchema.registry, { id: startRegistryId })
      .set({ canonical: newValue });
    return;
  }

  await context.ensDb.sql.execute(sql`
    WITH RECURSIVE walk(registry_id) AS (
      SELECT ${startRegistryId}::text

      UNION

      -- step downward: from a registry on the canonical subgraph, find each child Domain
      -- (rows whose registry_id equals the current registry id), then follow that Domain's
      -- subregistry_id if and only if the child registry agrees back via
      -- canonical_domain_id = domain.id.
      SELECT child_reg.id
      FROM walk w
      JOIN ${ensIndexerSchema.domain} d
        ON d.registry_id = w.registry_id
      JOIN ${ensIndexerSchema.registry} child_reg
        ON child_reg.id = d.subregistry_id
      WHERE child_reg.canonical_domain_id = d.id
    ),
    upd_reg AS (
      UPDATE ${ensIndexerSchema.registry}
        SET canonical = ${newValue}
        WHERE id IN (SELECT registry_id FROM walk)
          AND canonical IS DISTINCT FROM ${newValue}
        RETURNING id
    )
    UPDATE ${ensIndexerSchema.domain}
      SET canonical = ${newValue}
      WHERE registry_id IN (SELECT registry_id FROM walk)
        AND canonical IS DISTINCT FROM ${newValue};
  `);
}
