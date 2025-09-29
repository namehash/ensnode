import { Context, ponder } from "ponder:registry";
import { namespaceContract } from "@/lib/plugin-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { upsertDomainResolverRelation } from "@/plugins/protocol-acceleration/lib/domain-resolver-relationship-db-helpers";
import { LabelHash, Node, PluginName, makeSubdomainNode } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

/**
 * Handler functions for managing Domain-Resolver Relationships in ThreeDNSToken contracts.
 */
export default function () {
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "ThreeDNSToken:NewOwner"),
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
      const { label: labelHash, node: parentNode } = event.args;
      const node = makeSubdomainNode(labelHash, parentNode);

      // NetworkConfig#address is `Address | Address[] | undefined`, but we know this is a single address
      const resolverAddress = context.contracts[
        namespaceContract(PluginName.ProtocolAcceleration, "ThreeDNSResolver")
      ].address! as Address;

      // all ThreeDNSToken nodes have a hardcoded resolver at `resolverAddress`
      await upsertDomainResolverRelation(context, node, resolverAddress);
    },
  );
}
