import { Context, ponder } from "ponder:registry";

import { LabelHash, Node, PluginName, makeSubdomainNode } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

import { namespaceContract } from "@/lib/plugin-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";

import { upsertDomainResolverRelation } from "../lib/node-resolver-relationship-db-helpers";

/**
 * Handler functions for ThreeDNSToken contracts in the Protocol Acceleration plugin.
 * - manages Node-Resolver Relationships
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

      // all ThreeDNSToken nodes have a hardcoded resolver at that address
      await upsertDomainResolverRelation(context, node, resolverAddress);
    },
  );
}
