import config from "@/config";

import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, zeroAddress } from "viem";

import {
  getRootRegistry,
  getRootRegistryId,
  type LabelHash,
  makeSubdomainNode,
  type Node,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import {
  removeNodeResolverRelation,
  upsertNodeResolverRelation,
} from "@/lib/protocol-acceleration/node-resolver-relationship-db-helpers";
import { nodeIsMigrated } from "@/lib/protocol-acceleration/registry-migration-status";

async function handleNewOwner({
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
}) {
  //
}

async function handleNewResolver({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; resolver: Address }>;
}) {
  const { node, resolver: resolverAddress } = event.args;
  const registry = event.log.address;
  const isZeroResolver = isAddressEqual(zeroAddress, resolverAddress);

  if (isZeroResolver) {
    await removeNodeResolverRelation(context, registry, node);
  } else {
    await upsertNodeResolverRelation(context, registry, node, resolverAddress);
  }
}

/**
 * Handler functions for ENSv1 Regsitry contracts.
 * - piggybacks Protocol Resolution plugin's Node Migration status
 */
export default function () {
  /**
   * Sets up the ENSv2 Root Registry
   */
  ponder.on(namespaceContract(PluginName.ENSv2, "ENSv1RegistryOld:setup"), async ({ context }) => {
    // ensures that the Root Registry (which is eventually backed by the ENSv2 Root Registry) is
    // populated in the database
    await context.db
      .insert(schema.registry)
      .values({
        id: getRootRegistryId(config.namespace),
        type: "RegistryContract",
        ...getRootRegistry(config.namespace),
      })
      .onConflictDoNothing();
  });

  /**
   * Handles Registry#NewOwner for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  ponder.on(
    namespaceContract(PluginName.ENSv2, "ENSv1RegistryOld:NewOwner"),
    async ({ context, event }) => {
      const { label: labelHash, node: parentNode } = event.args;

      // ignore the event on ENSv1RegistryOld if node is migrated to new Registry
      const node = makeSubdomainNode(labelHash, parentNode);
      const shouldIgnoreEvent = await nodeIsMigrated(context, node);
      if (shouldIgnoreEvent) return;

      return handleNewOwner({ context, event });
    },
  );

  /**
   * Handles Registry#NewResolver for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  ponder.on(
    namespaceContract(PluginName.ENSv2, "ENSv1RegistryOld:NewResolver"),
    async ({ context, event }) => {
      // ignore the event on ENSv1RegistryOld if node is migrated to new Registry
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      return handleNewResolver({ context, event });
    },
  );

  /**
   * Handles Registry#NewResolver for:
   * - ENS Root Chain's ENSv1RegistryOld
   */
  ponder.on(
    namespaceContract(PluginName.ENSv2, "ENSv1RegistryOld:NewTTL"),
    async ({ context, event }) => {
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      return handleNewTTL({ context, event });
    },
  );

  ponder.on(
    namespaceContract(PluginName.ENSv2, "ENSv1RegistryOld:Transfer"),
    async ({ context, event }) => {
      const shouldIgnoreEvent = await nodeIsMigrated(context, event.args.node);
      if (shouldIgnoreEvent) return;

      return handleTransfer({ context, event });
    },
  );

  /**
   * Handles Registry events for:
   * - ENS Root Chain's (new) Registry
   * - Basenames Registry
   * - Lineanames Registry
   */
  ponder.on(namespaceContract(pluginName, "ENSv1Registry:NewOwner"), handleNewOwner);
  ponder.on(namespaceContract(pluginName, "ENSv1Registry:NewResolver"), handleNewResolver);
  ponder.on(namespaceContract(pluginName, "ENSv1Registry:NewTTL"), handleNewTTL);
  ponder.on(namespaceContract(pluginName, "ENSv1Registry:Transfer"), handleTransfer);
}
