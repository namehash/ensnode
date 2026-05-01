import config from "@/config";

import { type LabelHash, makeSubdomainNode, type Node } from "enssdk";

import { getENSRootChainId } from "@ensnode/datasources";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Why two tables for one logical "is this node migrated?" check.
 *
 * The check fires from many Registry handlers, but the event payload differs between them:
 *  - ENSv1Registry(Old)#NewOwner emits `parentNode` and `labelHash` as separate args.
 *  - ENSv1RegistryOld#Transfer / NewTTL / NewResolver emit only the post-namehash `node`
 *
 * Ponder's indexing-cache prefetch path predicts hot-table reads ahead of each event by deriving
 * the lookup key from the event's args — but its profile-pattern matcher can only do direct equality
 * and single-level string-delimiter splits. It can NOT invert keccak. So a table keyed by the
 * post-namehash `node` is unprofileable from a NewOwner event (where `node` is a computed namehash
 * of `(parentNode, labelHash)`), and a table keyed by `(parentNode, labelHash)` is unprofileable
 * from a Transfer/NewTTL/NewResolver event (which doesn't carry those fields).
 *
 * Either single-table choice surrenders prefetch on other handlers. Keying solely by
 * `(parentNode, labelHash)` would help the NewOwner hot path but disable prefetching on the other
 * three handlers, which can't reconstruct that pair from `node` without a reverse-index whose lookup
 * key is itself a un-prefetchable namehash.
 *
 * The two-table layout sidesteps both problems: write _both_ rows on every migration, then have each
 * read site address the table whose key matches its event payload. Both reads stay on the prefetch
 * hot-path. The cost is one extra "insert on conflict do nothing" per migration, and the storage of
 * that information, naturally, doubles. As of 2026-04-29, the size of the migrated_nodes_by_parent
 * table is ~1GB, meaning that this optimization will consume an additional ~1GB of storage but
 * will result in significantly faster indexing for the ENSv1Registry(Old) events.
 *
 * See {@link migratedNodeByParent} and {@link migratedNodeByNode} in the ensdb-sdk schema.
 */

const invariant_isENSRootChain = (context: IndexingEngineContext) => {
  if (context.chain.id === getENSRootChainId(config.namespace)) return;

  throw new Error(
    `Invariant: Node migration status is only relevant on the ENS Root Chain, and this function was called in the context of ${context.chain.id}.`,
  );
};

/**
 * Returns whether `(parentNode, labelHash)` has migrated to the new Registry contract. Used by
 * ENSv1RegistryOld#NewOwner where both fields are emitted as event args directly — keyed access
 * keeps the read on Ponder's prefetch hot-path.
 */
export async function nodeIsMigratedByParentAndLabel(
  context: IndexingEngineContext,
  parentNode: Node,
  labelHash: LabelHash,
) {
  invariant_isENSRootChain(context);

  const record = await context.ensDb.find(ensIndexerSchema.migratedNodeByParent, {
    parentNode,
    labelHash,
  });
  return record !== null;
}

/**
 * Returns whether `node` has migrated to the new Registry contract. Used by
 * ENSv1RegistryOld#Transfer/NewTTL/NewResolver where only `node` is emitted as an event arg —
 * keyed access on the sibling {@link migratedNodeByNode} table keeps the read on the prefetch
 * hot-path even though the composite-key {@link migratedNodeByParent} table can't be addressed
 * without a reverse lookup.
 */
export async function nodeIsMigrated(context: IndexingEngineContext, node: Node) {
  invariant_isENSRootChain(context);

  const record = await context.ensDb.find(ensIndexerSchema.migratedNodeByNode, { node });
  return record !== null;
}

/**
 * Record that `(parentNode, labelHash)` has migrated to the new Registry contract. Writes both
 * the composite-key {@link migratedNodeByParent} row and its sibling {@link migratedNodeByNode}
 * index so each downstream read site can address whichever key it can profile against event args.
 */
export async function migrateNode(
  context: IndexingEngineContext,
  parentNode: Node,
  labelHash: LabelHash,
) {
  invariant_isENSRootChain(context);

  await context.ensDb
    .insert(ensIndexerSchema.migratedNodeByParent)
    .values({ parentNode, labelHash })
    .onConflictDoNothing();

  const node = makeSubdomainNode(labelHash, parentNode);
  await context.ensDb
    .insert(ensIndexerSchema.migratedNodeByNode)
    .values({ node })
    .onConflictDoNothing();
}
