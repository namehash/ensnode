import config from "@/config";

import { sql } from "drizzle-orm";
import type {
  AccountId,
  DomainId,
  InterpretedName,
  LabelHash,
  LabelHashPath,
  NormalizedAddress,
  RegistryId,
} from "enssdk";

import {
  CANONICAL_NAME_PREFIX_LENGTH,
  truncateCanonicalNamePrefix,
} from "@ensnode/ensdb-sdk/ensindexer-abstract";
import { isRootRegistryId } from "@ensnode/ensnode-sdk";
import { isBridgedResolver, isBridgedTargetRegistry } from "@ensnode/ensnode-sdk/internal";

import { namehashLabelHashPath } from "@/lib/ensv2/namehash-label-hash-path";
import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Canonicality db helpers.
 *
 * A Registry is canonical iff it can be traced back to a Root Registry via bi-directionally agreed
 * upon canonical edges. A canonical edge between Registry R and parent Domain D requires both
 * unidirectional pointers to agree (`R.canonicalDomainId = D.id` ↔ `D.subregistryId = R.id`)
 * AND for D itself to be canonical. Root Registries (ENSv1 root, ENSv2 root) are canonical by
 * definition and seeded as Canonical at `ensureRegistry`-time. This definition of canonicality is
 * taken from ENSv2 and then applied to ENSv1, so naturally some ENSv1 Domains will not be considered
 * canonical, since ENSv1 didn't necessitate the same concept.
 *
 * Concretely, this means a v1 Domain with a Bridged Resolver leaves its v1 children as non-canonical.
 * Example: mainnet `linea.eth` has a Bridged Resolver pointing at the Linea Chain's `linea.eth`
 * ENSv1VirtualRegistry. `bridge.linea.eth` exists on both mainnet (as a v1 child of mainnet's
 * `linea.eth` ENSv1VirtualRegistry) and Linea (as a child of the Linea Chain's `linea.eth`
 * ENSv1VirtualRegistry); but because mainnet's `linea.eth`'s Subregistry points at the Linea Chain's `linea.eth`
 * ENSv1VirtualRegistry agreement fails for `bridge.linea.eth` and it stays non-canonical (and so do
 * its theoretical children). Only the Linea-side `bridge.linea.eth` (the resolution-visible one) is
 * canonical. This mirrors the ENSv2 definition of Canonicality (nameability is derived from having
 * the Root Registry as the oldest ancestor). This is an acceptable limitation to enforce the purity
 * and universality of the following canonicality logic.
 *
 * The unidirectional pointers `Registry.canonicalDomainId` and `Domain.subregistryId` are written
 * directly when their onchain events fire, to store the on-chain state as-is. Edge authentication
 * is done on-demand at query time. The boolean flags `Registry.canonical` and `Domain.canonical`
 * are materialized from membership in the canonical nametree, and are kept up-to-date by reconciling
 * during updates to the uni-directional pointers.
 *
 * `reconcileRegistryCanonicality` cascades through the canonical nametree beneath the Registry
 * in two situations: (a) the Registry's `canonical` flag flipped, or (b) the Registry's canonical
 * parent Domain identity changed while the flag stays canonical, which leaves descendants'
 * materialized canonical-tree fields (`canonicalName`, `canonicalLabelHashPath`, `canonicalPath`,
 * `canonicalDepth`, `canonicalNode`) rooted at the previous parent's path and therefore stale. Situation (b) only arises when
 * `Registry.canonicalDomainId` itself was updated (handled via `handleRegistryCanonicalDomainUpdated`);
 * `handleSubregistryUpdated` cannot change which Domain is the canonical parent of a given Registry,
 * only whether the existing pointer agrees. Two cascade paths:
 *   - If the Registry has no descendants (`Registry.__hasChildren = false`, the dominant case
 *     for fresh ENSv1 virtual registries on creation), the cascade is a single-row flag
 *     flip done via an in-memory PK update (only when the flag actually flipped — a parent-only
 *     change with no descendants has nothing to re-materialize). No raw SQL, no flush. This
 *     optimization no-ops the expensive reconciliation CTE for all ENSv1 Domains.
 *   - Otherwise, a single recursive-CTE batch UPDATE walks the canonical subgraph via the
 *     unidirectional pointers + inline agreement check, batch-updating every visited Registry
 *     and its child Domains. This goes through `context.ensDb.sql`, which forces a Ponder cache
 *     flush + invalidate. We accept that cost because it's bounded to Registries that have
 *     children AND that need a cascade — i.e. bridged-resolver attach/detach and ENSv2 reparenting
 *     on already-populated subtrees.
 *
 * `__hasChildren` is a monotonic sentinel on `Registry` (false → true on the first child Domain
 * registered under it; never reset). See `ensureDomainInRegistry` for where it is flipped.
 */

/**
 * Idempotently inherit `canonical` on `domainId` from its parent `registryId`, and mark the
 * parent Registry as having children (`__hasChildren = true`).
 *
 * Because of the invariant that Registry exist before Domain (thankfully true in both protocols),
 * when a Domain is added to a Registry, the Registry's `canonical` flag has already been reconciled.
 * So the new Domain trivially inherits the parent's current flag with no cascade required, since a
 * brand-new Domain has no children of its own (thanks again to the above invariant).
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
  labelHash: LabelHash,
): Promise<void> {
  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  if (!registry) {
    throw new Error(
      `Invariant(ensureDomainInRegistry): Registry '${registryId}' must exist before linking Domain '${domainId}'.`,
    );
  }

  // Materialize canonical-tree fields when the parent Registry is canonical. When it isn't,
  // we rely on two invariants and skip the write entirely:
  //   1. Fresh Domain rows default to `canonical = false` (column default), so the typical insert
  //      flow needs no write here.
  //   2. `cascadeCanonicality` flips every descendant (canonical + the three materialized fields)
  //      whenever a Registry's `canonical` flag flips, so re-runs of `ensureDomainInRegistry`
  //      against an existing row always observe the row already in sync with the Registry.
  // NOTE: this is the fast-path for ENSv1 Domains, where we avoid the UPDATE CTE
  if (registry.canonical) {
    // Invariant: callers ensure the Label row (via ensureLabel / ensureUnknownLabel) before this
    // function. The Label is required to materialize `canonicalName`.
    const label = await context.ensDb.find(ensIndexerSchema.label, { labelHash });
    if (!label) {
      throw new Error(
        `Invariant(ensureDomainInRegistry): Label '${labelHash}' must exist before linking Domain '${domainId}'.`,
      );
    }

    // Read the canonical parent Domain (if any) to inherit its materialized path/name. Root
    // Registries have no canonical parent Domain (`canonicalDomainId` is null) and seed the path/name.
    const parentDomain = registry.canonicalDomainId
      ? await context.ensDb.find(ensIndexerSchema.domain, { id: registry.canonicalDomainId })
      : null;

    // If we found a canonical parent Domain, it must itself be materialized. Otherwise we'd
    // silently store a truncated `canonicalName` (just `label.interpreted`) for a non-root Domain.
    if (parentDomain && !parentDomain.canonicalName) {
      throw new Error(
        `Invariant(ensureDomainInRegistry): canonical parentDomain '${parentDomain.id}' is missing canonicalName.`,
      );
    }

    // construct the Canonical LabelHashPath (head-first traversal order: root → leaf)
    const canonicalLabelHashPath: LabelHashPath = [
      ...(parentDomain?.canonicalLabelHashPath ?? []),
      labelHash,
    ];

    // construct the Canonical Path of DomainIds (head-first, parallel to canonicalLabelHashPath)
    const canonicalPath: DomainId[] = [...(parentDomain?.canonicalPath ?? []), domainId];

    // construct the Canonical Name
    const canonicalName = (
      parentDomain?.canonicalName
        ? `${label.interpreted}.${parentDomain.canonicalName}`
        : label.interpreted
    ) as InterpretedName;

    // construct the Canonical Node
    const canonicalNode = namehashLabelHashPath(canonicalLabelHashPath);

    await context.ensDb.update(ensIndexerSchema.domain, { id: domainId }).set({
      canonical: true,
      canonicalName,
      __canonicalNamePrefix: truncateCanonicalNamePrefix(canonicalName),
      canonicalLabelHashPath,
      canonicalPath,
      canonicalDepth: canonicalLabelHashPath.length,
      canonicalNode,
    });
  }

  // flip the parent Registry's __hasChildren sentinel on the first child (idempotent thereafter)
  if (!registry.__hasChildren) {
    await context.ensDb
      .update(ensIndexerSchema.registry, { id: registryId })
      .set({ __hasChildren: true });
  }
}

/**
 * Set `registryId`'s canonical parent Domain (or unset if null) by writing the unidirectional
 * `Registry.canonicalDomainId` pointer, then reconciling this Registry's canonicality flag
 * (which cascades through its descendants if it flips).
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
      `Invariant(handleRegistryCanonicalDomainUpdated): Registry ${registryId} does not yet exist.`,
    );
  }

  // if this Registry's Canonical Domain isn't changing, no-op
  const prevCanonicalDomainId = registry.canonicalDomainId ?? null;
  if (prevCanonicalDomainId === nextCanonicalDomainId) return;

  // set/unset the Registry's Canonical Domain (uni-directional Registry → Domain link)
  await context.ensDb
    .update(ensIndexerSchema.registry, { id: registryId })
    .set({ canonicalDomainId: nextCanonicalDomainId });

  // the registry's pointer changed, so its canonical-edge agreement may have changed too
  await reconcileRegistryCanonicality(context, registryId, prevCanonicalDomainId);
}

/**
 * Handles canonicality when a Domain updates its Subregistry. Similar to
 * `handleRegistryCanonicalDomainUpdated`, the new Subregistry need not exist yet — `Domain.subregistryId`
 * is set blindly. The canonical edge becomes "real" only when `Registry.canonicalDomainId` agrees,
 * which may happen later via `handleRegistryCanonicalDomainUpdated`.
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

  // update the Domain's Subregistry (uni-directional Domain → Registry link)
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
 * Derives the previous bridged target from the Domain's own `subregistryId` (the field this helper
 * owns) rather than the Domain-Resolver Relation. Protocol Acceleration's NewResolver/ResolverUpdated
 * handlers overwrite the DRR row for the SAME event, so reading the DRR here would depend on
 * cross-plugin handler ordering. Reading `subregistryId` keeps this helper order-independent.
 *
 * This helper manages only the originating Domain's `subregistryId` (pointing it at the Bridged
 * Resolver's target Registry, or clearing it). The target Registry's `canonicalDomainId` is owned
 * by the registry-creation path in `ENSv1Registry.ts`, not here.
 */
export async function handleBridgedResolverChange(
  context: IndexingEngineContext,
  registry: AccountId,
  domainId: DomainId,
  nextResolver: NormalizedAddress | null,
): Promise<void> {
  const nextBridged = nextResolver
    ? isBridgedResolver(config.namespace, { chainId: registry.chainId, address: nextResolver })
    : null;

  // the Domain's current bridged target, derived from its own `subregistryId` rather than the DRR
  const domain = await context.ensDb.find(ensIndexerSchema.domain, { id: domainId });
  const prevBridged = domain?.subregistryId
    ? isBridgedTargetRegistry(config.namespace, domain.subregistryId)
    : null;

  // the previous and the next bridged targets are identical, no-op
  // NOTE: this also covers the "neither is a bridged resolver" case (null === null)
  if (prevBridged?.targetRegistryId === nextBridged?.targetRegistryId) return;

  // handle the domain's implicit SubregistryUpdated event
  await handleSubregistryUpdated(context, domainId, nextBridged?.targetRegistryId ?? null);
}

/**
 * Recompute `Registry.canonical` from its current canonical-edge agreement and, if the flag
 * flips (or if the Registry remains canonical under a now-different parent), cascade through
 * the canonical subgraph beneath this Registry via a single recursive-CTE batch UPDATE.
 *
 * Canonicality rule:
 *   - Root Registries (ENSv1 root, ENSv2 root) are canonical by axiom.
 *   - For any non-root Registry R, R.canonical iff
 *       ∃ Domain P:
 *         P.id = R.canonicalDomainId      // R points up to P
 *         AND P.subregistryId = R.id      // P points down to R (bidirectional agreement)
 *         AND P.canonical                 // P itself is in the canonical nametree
 *
 * `prevCanonicalDomainId` is the value of `Registry.canonicalDomainId` before whatever mutation
 * prompted this reconcile. Callers that wrote a new value to that pointer
 * (`handleRegistryCanonicalDomainUpdated`) pass the overwritten value; callers that did not
 * touch the pointer (`handleSubregistryUpdated`) omit the argument (leaving it `undefined`). Reconcile
 * compares it against the current state to detect parent-identity changes: when the pointer
 * swings from one canonical-agreeing parent to another, the flag stays true but descendants'
 * materialized `canonicalName` / `canonicalLabelHashPath` / `canonicalNode` are rooted at the
 * prior parent and must be re-materialized from the new parent's path.
 *
 * Termination of the cascade walk relies on the canonical subgraph being a tree: each Registry
 * has at most one canonical parent Domain (enforced by the bidirectional agreement check), so
 * the recursive CTE cannot revisit a node. If that invariant is ever violated and a cycle is
 * introduced, the CTE's `UNION` (not `UNION ALL`) prunes duplicates and termination is preserved.
 */
async function reconcileRegistryCanonicality(
  context: IndexingEngineContext,
  registryId: RegistryId,
  prevCanonicalDomainId?: DomainId | null,
): Promise<void> {
  // hilariously, we need to guard against any random Registry setting its Subregistry to the Root
  // Registry, which would otherwise un-canonicalize the whole Canonical Nametree. because the
  // Root Registries are always canonical, they never need reconciliation; no-op
  if (isRootRegistryId(config.namespace, registryId)) return;

  const registry = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
  // if there's no registry, we can no-op; this reconciliation is a no-op if a Domain has set a
  // Subregistry that doesn't exist yet. once the subregistry exists and sets its Canonical Domain,
  // handleRegistryCanonicalDomainUpdated will trigger the appropriate reconciliation
  if (!registry) return;

  // determine the new canonicality from the current pointer state
  let nextCanonical: boolean;
  if (!registry.canonicalDomainId) {
    nextCanonical = false;
  } else {
    const parentDomain = await context.ensDb.find(ensIndexerSchema.domain, {
      id: registry.canonicalDomainId,
    });
    nextCanonical =
      parentDomain != null && parentDomain.subregistryId === registryId && parentDomain.canonical;
  }

  // cascade materializations if
  // a) canonicality changed or
  // b) relative location in the tree changed and the subtree will become canonical
  // NOTE: that guarding the relative location change upon whether the registry becomes canonical
  //   allows us to avoid the cascade if a Registry just changes its parent from one non-canonical
  //   Domain to another
  const canonicalityChanged = registry.canonical !== nextCanonical;
  const canonicalDomainChanged =
    prevCanonicalDomainId !== undefined && // only consider changed if set
    prevCanonicalDomainId !== (registry.canonicalDomainId ?? null); // is changed if prev != next

  const needsMaterialization = canonicalityChanged || (nextCanonical && canonicalDomainChanged);

  // no-op if no update necessary
  if (!needsMaterialization) return;

  if (registry.__hasChildren) {
    // bulk-update this subtree via the CTE; its WHERE clause detects flag-flip rows and
    // stale-path rows alike, so no per-row hint is needed
    await cascadeCanonicality(context, registryId, nextCanonical);
  } else if (canonicalityChanged) {
    // no descendants and the flag actually flipped: update only this Registry's own flag using
    // the Ponder cache (ENSv1 fast-path). A parent-only change with no descendants has nothing
    // to re-materialize, so we skip the write entirely.
    await context.ensDb
      .update(ensIndexerSchema.registry, { id: registryId })
      .set({ canonical: nextCanonical });
  }
  // else: `needsMaterialization` was true (`nextCanonical && canonicalDomainChanged`) but
  // `__hasChildren = false` — the Registry stayed canonical under a new parent identity, and
  // there are no descendants whose materialized fields could be stale. No write needed.
}

/**
 * Propagate a Label heal to every canonical Domain whose `canonicalLabelHashPath` contains
 * `labelHash`. Re-renders `canonical_name` (and its materialized `__canonical_name_prefix`) by
 * joining each path element to its current `label.interpreted` value, computing the name once in a
 * CTE so the `string_agg` isn't run twice. `canonicalLabelHashPath` is head-first (root → leaf), but
 * `canonicalName` is the standard leaf-first ENS string (e.g. "vitalik.eth"), so the
 * WITH ORDINALITY rows are joined in DESC ordinal order.
 *
 * `canonicalLabelHashPath` and `canonicalNode` are untouched — label heals don't change labelHashes.
 *
 * Selectivity comes from the GIN index `byCanonicalLabelHashPath` on `canonical_label_hash_path`.
 * Note: GIN indexes are applied at realtime by Ponder, not during backfill — backfill-time heal
 * cascades degenerate to a sequential scan; re-assess whether a lookup table would help, or perhaps
 * introduce a non-ponder-managed index on this column via eventHandlerPreconditions.
 */
export async function cascadeLabelHeal(
  context: IndexingEngineContext,
  labelHash: LabelHash,
): Promise<void> {
  await context.ensDb.sql.execute(sql`
    WITH healed_names AS (
      SELECT
        d.id,
        (
          SELECT string_agg(l.interpreted, '.' ORDER BY p.ord DESC)
          FROM unnest(d.canonical_label_hash_path) WITH ORDINALITY AS p(lh, ord)
          JOIN ${ensIndexerSchema.label} l ON l.label_hash = p.lh
        ) AS name
      FROM ${ensIndexerSchema.domain} d
      WHERE d.canonical = true
        AND d.canonical_label_hash_path @> ARRAY[${labelHash}]::text[]
    )
    UPDATE ${ensIndexerSchema.domain} AS d
      SET canonical_name = healed_names.name,
          __canonical_name_prefix = left(healed_names.name, ${CANONICAL_NAME_PREFIX_LENGTH})
      FROM healed_names
      WHERE d.id = healed_names.id;
  `);
}

/**
 * Walk the canonical nametree rooted at `registryId` and set `canonical = nextCanonical` on
 * every Registry and Domain it visits, additionally materializing canonical-tree fields on
 * every affected Domain.
 *
 * Two phases:
 *   - Phase A is a single statement: one recursive CTE that enumerates the canonical nametree
 *     by following unidirectional pointers + agreement check, while carrying the partial
 *     `parent_path` / `parent_name` accumulators down the tree. A data-modifying CTE batch-updates
 *     Registry rows; the trailing UPDATE batch-updates Domain rows with the materialized
 *     `canonical_name` / `canonical_label_hash_path`, nulls `canonical_node` (Phase B fills it),
 *     and `RETURNING`s the updated (id, canonical_label_hash_path) for the JS-RTT pass.
 *   - Phase B is JS-side: chunked bulk UPDATEs that compute `canonical_node` via
 *     `namehashLabelHashPath` over each row's `canonical_label_hash_path`. Only runs when
 *     `nextCanonical = true`; when flipping to false, Phase A already nulled `canonical_node`.
 *
 * The Registry UPDATE's `IS DISTINCT FROM` filter skips rows already at the target value (the
 * start registry's flag is set in the same statement, and any descendants that happen to already
 * be consistent are no-op'd). The Domain UPDATE's WHERE filter touches a row when either its
 * flag flipped OR (when staying canonical) its `canonicalLabelHashPath` or `canonicalPath`
 * differs from the freshly-computed path — this second clause handles the parent-identity-changed
 * case where the flag stays canonical but materialized paths are stale. Both arrays are checked
 * because two distinct canonical Domains can share a `canonicalLabelHashPath` across protocol
 * roots (e.g. v1 `linea.eth` and v2 `linea.eth`), so re-parenting a Registry between such Domains
 * leaves `canonicalLabelHashPath` equal while `canonicalPath` (DomainIds) drifts.
 *
 * Because a canonicalization update may affect an unbounded number of objects in the tree, we
 * batch the subsequent updates to at least buffer the severity of this operation.
 */
const CANONICAL_NODE_UPDATE_BATCH_SIZE = 10_000;

async function cascadeCanonicality(
  context: IndexingEngineContext,
  registryId: RegistryId,
  nextCanonical: boolean,
): Promise<void> {
  const changed = await context.ensDb.sql.execute(sql`
    WITH RECURSIVE walk(registry_id, parent_path, parent_path_ids, parent_name) AS (
      -- base: seed parent_path / parent_path_ids / parent_name from the start registry's canonical
      -- parent Domain (if any). The start Registry may be a root, in which case no parent Domain
      -- exists and seeds are () / () / NULL.
      SELECT
        ${registryId}::text,
        COALESCE(seed.canonical_label_hash_path, ARRAY[]::text[]),
        COALESCE(seed.canonical_path, ARRAY[]::text[]),
        seed.canonical_name
      FROM (
        SELECT pd.canonical_label_hash_path, pd.canonical_path, pd.canonical_name
        FROM ${ensIndexerSchema.registry} r
        LEFT JOIN ${ensIndexerSchema.domain} pd ON pd.id = r.canonical_domain_id
        WHERE r.id = ${registryId}
      ) seed

      UNION

      -- step downward via the canonical-edge agreement, extending parent_path / parent_path_ids /
      -- parent_name by the linking Domain's labelHash / id / interpreted label. The path is
      -- head-first (root → leaf), so we APPEND; the name is the standard leaf-first ENS string
      -- ("vitalik.eth"), so we PREPEND.
      SELECT
        child_reg.id,
        w.parent_path || ARRAY[d.label_hash],
        w.parent_path_ids || ARRAY[d.id],
        COALESCE(l.interpreted || '.' || w.parent_name, l.interpreted)
      FROM walk w
      JOIN ${ensIndexerSchema.domain} d
        ON d.registry_id = w.registry_id
      JOIN ${ensIndexerSchema.label} l
        ON l.label_hash = d.label_hash
      JOIN ${ensIndexerSchema.registry} child_reg
        ON child_reg.id = d.subregistry_id
       AND child_reg.canonical_domain_id = d.id
    ),
    domain_targets AS (
      -- for each Registry in the walk, enumerate ALL of its child Domains (regardless of whether
      -- they themselves have a canonical-agreeing subregistry) and project the materialized
      -- path / path_ids / name. Head-first → APPEND labelHash and id; leaf-first name → PREPEND
      -- interpreted label.
      --
      -- The agreement filter is intentionally omitted here. Membership in the canonical nametree
      -- is determined per-Domain via Domain.canonical, and every Domain that belongs to a canonical
      -- Registry inherits that Registry canonical flag (see ensureDomainInRegistry). When the
      -- Registry flag flips (or its identity-as-parent changes), every Domain row under it must
      -- follow — including ones whose own subregistryId does not agree, because those Domains
      -- never seed a separate canonical subtree (the canonical nametree is a strict tree, enforced
      -- by the bidirectional agreement check on the walk CTE).
      SELECT
        d.id AS domain_id,
        w.parent_path || ARRAY[d.label_hash] AS new_path,
        w.parent_path_ids || ARRAY[d.id] AS new_path_ids,
        COALESCE(l.interpreted || '.' || w.parent_name, l.interpreted) AS new_name
      FROM walk w
      JOIN ${ensIndexerSchema.domain} d
        ON d.registry_id = w.registry_id
      JOIN ${ensIndexerSchema.label} l
        ON l.label_hash = d.label_hash
    ),
    upd_reg AS (
      UPDATE ${ensIndexerSchema.registry}
        SET canonical = ${nextCanonical}
        WHERE id IN (SELECT registry_id FROM walk)
          AND canonical IS DISTINCT FROM ${nextCanonical}
        RETURNING id
    )
    UPDATE ${ensIndexerSchema.domain} AS d
      SET canonical = ${nextCanonical},
          canonical_name = CASE WHEN ${nextCanonical} THEN dt.new_name ELSE NULL END,
          __canonical_name_prefix = CASE WHEN ${nextCanonical} THEN left(dt.new_name, ${CANONICAL_NAME_PREFIX_LENGTH}) ELSE NULL END,
          canonical_label_hash_path = CASE WHEN ${nextCanonical} THEN dt.new_path ELSE NULL END,
          canonical_path = CASE WHEN ${nextCanonical} THEN dt.new_path_ids ELSE NULL END,
          canonical_depth = CASE WHEN ${nextCanonical} THEN array_length(dt.new_path, 1) ELSE NULL END,
          canonical_node = NULL
      FROM domain_targets dt
      WHERE d.id = dt.domain_id
        AND (
          d.canonical IS DISTINCT FROM ${nextCanonical}
          OR (
            ${nextCanonical}
            AND (
              d.canonical_label_hash_path IS DISTINCT FROM dt.new_path
              OR d.canonical_path IS DISTINCT FROM dt.new_path_ids
            )
          )
        )
      RETURNING d.id, d.canonical_label_hash_path;
  `);

  // Phase B: when flipping to canonical, compute and write `canonical_node` per affected Domain.
  // When flipping to non-canonical, Phase A already nulled `canonical_node` — nothing to do.
  // NOTE: this is necessary because there's no labelhash-aware namehash fn in postgres
  // TODO: perhaps we could add a namehash fn in eventHandlerPreconditions and collapse this into
  // a single update?
  // NOTE: this step could be avoided if we didn't need to materialize the Canonical Node — if not
  // necessary, we can simply rip it out. currently implied as necessary by
  // https://github.com/namehash/ensnode/issues/1962
  if (!nextCanonical) return;

  // NOTE: Ponder types `db.sql` as a NodePg/Pglite Drizzle (whose `.execute()` resolves to a
  // `{ rows }` result), but at runtime it's a pg-proxy Drizzle whose `.execute()` resolves to the
  // rows array directly. The declared type lies (Ponder `@ts-expect-error`s the mismatch), so reading
  // `changed.rows` is `undefined` at runtime — `changed` itself is the array.
  const rows = changed as unknown as { id: DomainId; canonical_label_hash_path: LabelHashPath }[];
  for (let i = 0; i < rows.length; i += CANONICAL_NODE_UPDATE_BATCH_SIZE) {
    const batch = rows.slice(i, i + CANONICAL_NODE_UPDATE_BATCH_SIZE);
    const ids = batch.map((r) => r.id);
    const nodes = batch.map((r) => namehashLabelHashPath(r.canonical_label_hash_path));

    await context.ensDb.sql.execute(sql`
      UPDATE ${ensIndexerSchema.domain} AS d
        SET canonical_node = upd.canonical_node
        FROM unnest(${sql.param(ids)}::text[], ${sql.param(nodes)}::text[]) AS upd(id, canonical_node)
        WHERE d.id = upd.id;
    `);
  }
}
