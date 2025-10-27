import config from "@/config";

import { type Context, ponder } from "ponder:registry";
import type { Address } from "viem";

import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import {
  type ChainId,
  type LabelHash,
  makeSubdomainNode,
  type Node,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { upsertNodeResolverRelation } from "@/lib/protocol-acceleration/node-resolver-relationship-db-helpers";

const ThreeDNSResolverByChainId: Record<ChainId, Address> = [
  DatasourceNames.ThreeDNSBase,
  DatasourceNames.ThreeDNSOptimism,
]
  .map((datasourceName) => maybeGetDatasource(config.namespace, datasourceName))
  .filter((ds) => !!ds)
  .reduce(
    (memo, datasource) => ({
      ...memo,
      // each ThreeDNS* Datasource defines a 'Resolver' ContractConfig with a single Address
      [datasource.chain.id]: datasource.contracts.Resolver!.address as Address,
    }),
    {},
  );

/**
 * Handler functions for ThreeDNSToken contracts in the Protocol Acceleration plugin.
 * - indexes Node-Resolver Relationships for all nodes registred in ThreeDNSToken
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
      const registry = event.log.address;
      const node = makeSubdomainNode(labelHash, parentNode);

      const resolverAddress = ThreeDNSResolverByChainId[context.chain.id];
      if (!resolverAddress) {
        throw new Error(
          `Invariant: ThreeDNSToken ${event.log.address} on chain ${context.chain.id} doesn't have an associated Resolver?`,
        );
      }

      // all ThreeDNSToken nodes have a hardcoded resolver at that address
      await upsertNodeResolverRelation(context, registry, node, resolverAddress);
    },
  );
}
