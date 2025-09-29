import { Context, ponder } from "ponder:registry";
import config from "@/config";
import { namespaceContract } from "@/lib/plugin-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { migrateNode, nodeIsMigrated } from "@/lib/registry-migration-status";
import {
  removeDomainResolverRelation,
  upsertDomainResolverRelation,
} from "@/plugins/protocol-acceleration/lib/domain-resolver-relationship-db-helpers";
import { getENSRootChainId } from "@ensnode/datasources";
import { LabelHash, Node, PluginName, makeSubdomainNode } from "@ensnode/ensnode-sdk";
import { Address, isAddressEqual, zeroAddress } from "viem";

const ensRootChainId = getENSRootChainId(config.namespace);

async function handleNewResolver({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; resolver: Address }>;
}) {
  const { node, resolver: resolverAddress } = event.args;
  const isZeroResolver = isAddressEqual(zeroAddress, resolverAddress);

  if (isZeroResolver) {
    await removeDomainResolverRelation(context, node);
  } else {
    await upsertDomainResolverRelation(context, node, resolverAddress);
  }
}

/**
 * Handler functions for managing Domain-Resolver Relationships in Regsitry contracts. Includes
 * RegistryOld migration logic, ignoring events on RegistryOld when the node is migrated to the
 * (new) Registry contract.
 */
export default function () {
  /**
   * Implements Registry migration tracking for the ProtocolAcceleration plugin by tracking instances
   *
   * TODO:
   */
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Registry:NewOwner"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        // NOTE: `node` event arg represents a `Node` that is the _parent_ of the node the NewOwner event is about
        node: Node;
        // NOTE: `label` event arg represents a `LabelHash` for the sub-node under `node`
        label: LabelHash;
        owner: Address;
      }>;
    }) => {
      // no-op because we only track registry migration status on ENS Root Chain
      if (context.chain.id !== ensRootChainId) return;

      const { label: labelHash, node: parentNode } = event.args;
      const node = makeSubdomainNode(labelHash, parentNode);
      await migrateNode(context, node);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "RegistryOld:NewResolver"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; resolver: Address }>;
    }) => {
      // ignore the event on RegistryOld if node is migrated to new Registry
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      await handleNewResolver({ context, event });
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Registry:NewResolver"),
    handleNewResolver,
  );
}
