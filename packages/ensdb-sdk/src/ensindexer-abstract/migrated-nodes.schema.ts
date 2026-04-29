/**
 * Schema Definitions that track ENS Registry migration status for Protocol Acceleration.
 */

import type { LabelHash, Node } from "enssdk";
import { onchainTable, primaryKey } from "ponder";

/**
 * Tracks the migration status of a node.
 *
 * Due to a security issue, ENS migrated from the RegistryOld contract to a new Registry
 * contract. When indexing events, the indexer must ignore any events on the RegistryOld for domains
 * that have since been migrated to the new Registry.
 *
 * To store the necessary information required to implement this behavior, we track the set of nodes
 * that have been registered in the (new) Registry contract on the ENS Root Chain. When an event is
 * encountered on the RegistryOld contract, if the relevant node exists in this set, the event should
 * be ignored, as the node is considered migrated.
 *
 * Note that this logic is only necessary for the ENS Root Chain, the only chain that includes the
 * Registry migration: we do not track nodes in the the Basenames and Lineanames deployments of the
 * Registry on their respective chains, for example.
 *
 * Note also that this Registry migration tracking is isolated to the Protocol Acceleration schema/plugin.
 * That is, the subgraph plugin implements its own Registry migration logic. By isolating this logic
 * to the Protocol Acceleration plugin, we allow the Protocol Acceleration plugin to be run
 * independently of other plugins.
 *
 * Note also that we key this record by (parentNode, labelHash) to stay on Ponder's prefetch hot-path,
 * which requires that the key of the entity be trivially derived from event arguments. Because this
 * record is consulted in the context of the ENSv1RegistryOld#NewOwner event (which emits both
 * `parentNode` and `labelHash` directly), keying by (parentNode, labelHash) lets Ponder's profile
 * pattern matcher recover the key from event args. See the helper module's block comment for the
 * full rationale.
 *
 * The ensv2 plugin depends on the Protocol Acceleration plugin in order to piggyback on this
 * Registry migration logic.
 */
export const migratedNodeByParent = onchainTable(
  "migrated_nodes_by_parent",
  (t) => ({
    // keyed by (parentNode, labelHash)
    parentNode: t.hex().$type<Node>(),
    labelHash: t.hex().$type<LabelHash>(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.parentNode, t.labelHash] }),
  }),
);

/**
 * Sibling lookup-by-namehash table for {@link migratedNodeByParent}. Indexed by `node` so that
 * ENSv1RegistryOld#Transfer/NewTTL/NewResolver — which emit only `node` — can read migration
 * status on Ponder's prefetch hot-path. Existence in this table is equivalent to existence in
 * {@link migratedNodeByParent}; both are written together by the migration helper.
 */
export const migratedNodeByNode = onchainTable("migrated_nodes_by_node", (t) => ({
  node: t.hex().primaryKey().$type<Node>(),
}));
