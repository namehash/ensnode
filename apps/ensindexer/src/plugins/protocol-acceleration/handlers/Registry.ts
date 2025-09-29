import { Context, ponder } from "ponder:registry";
import { namespaceContract } from "@/lib/plugin-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { subgraph_nodeIsMigrated } from "@/lib/registry-migration-status";
import {
  removeDomainResolverRelation,
  upsertDomainResolverRelation,
} from "@/plugins/protocol-acceleration/lib/domain-resolver-relationship-db-helpers";
import { Node, PluginName } from "@ensnode/ensnode-sdk";
import { Address, isAddressEqual, zeroAddress } from "viem";

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
      // TODO(core-plugin-independent): make this check core-plugin-independent
      const shouldIgnoreEvent = await subgraph_nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      await handleNewResolver({ context, event });
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Registry:NewResolver"),
    handleNewResolver,
  );
}
