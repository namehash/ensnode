import config from "@/config";

import type { LabelHash, Node, NormalizedAddress } from "enssdk";

import { getENSRootChainId } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { migrateNode } from "@/lib/protocol-acceleration/migrated-node-db-helpers";

const ensRootChainId = getENSRootChainId(config.namespace);

/**
 * Node migration handler — tracks ENSv1RegistryOld → ENSv1Registry migration on the ENS Root Chain.
 *
 * Extracted from the 'protocol-acceleration' plugin so its migration tracking is callable when
 * either plugin is active, independent of plugin selection.
 *
 * Correctness does NOT depend on handler registration order: this writes `nodeIsMigrated` on the
 * new Registry's `ENSv1Registry:NewOwner`, while the Old-registry guards read it on
 * `ENSv1RegistryOld:*` events. Those are different logs, so Ponder's checkpoint ordering guarantees
 * a node's migration is processed before any later Old-registry event that consults it.
 */
export default function () {
  addOnchainEventListener(
    namespaceContract(PluginName.ProtocolAcceleration, "ENSv1Registry:NewOwner"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        node: Node;
        label: LabelHash;
        owner: NormalizedAddress;
      }>;
    }) => {
      // no-op because we only track registry migration status on ENS Root Chain
      if (context.chain.id !== ensRootChainId) return;

      const { label: labelHash, node: parentNode } = event.args;
      await migrateNode(context, parentNode, labelHash);
    },
  );
}
