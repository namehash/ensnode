import { onchainTable } from "ponder";

/**
 * Tracks the migration status of a node.
 *
 * Due to a security issue, ENS migrated from the RegistryOld contract to a new Registry
 * contract. When indexing events, the indexer must ignore any events on the RegistryOld for domains
 * that have been migrated to the new Registry.
 *
 * To store the necessary information required to implement this behavior, we track the set of nodes
 * that have been encountered by the (new) Registry contract on the ENS Root Chain. When an event is
 * encountered on the RegistryOld contract, if the relevant node exists in this set, the event should
 * be ignored, as the node is considered migrated.
 *
 * This set of nodes is restricted to those registered in the Registry contract on the ENS Root
 * Chain: we do not track nodes in the the Basenames and Lineanames deployments of the Registry on
 * their respective chains, for example.
 */
export const ext_migratedNodes = onchainTable("ext_migrated_nodes", (t) => ({
  node: t.hex().primaryKey(),
}));
