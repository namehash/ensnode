import { onchainTable } from "ponder";

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
 */
export const ext_migratedNodes = onchainTable("ext_migrated_nodes", (t) => ({
  node: t.hex().primaryKey(),
}));
