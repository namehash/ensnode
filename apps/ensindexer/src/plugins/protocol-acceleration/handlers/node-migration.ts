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
 * Extracted from the ProtocolAcceleration plugin so it can be registered before both the ENSv2 and
 * ProtocolAcceleration plugins. This guarantees `nodeIsMigrated` reads from a populated table when
 * those plugins' Old-registry guards run.
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
