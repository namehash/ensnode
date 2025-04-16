import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { ENSDeployments } from "@ensnode/ens-deployments";
import type { Node, PluginName } from "@ensnode/utils";
import { type Address, Hash, type Hex, decodeEventLog } from "viem";

import { makeSharedEventValues, upsertAccount, upsertResolver } from "@/lib/db-helpers";
import { makeResolverId } from "@/lib/ids";
import { hasNullByte, uniq } from "@/lib/lib-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

/**
 * makes a set of shared handlers for Resolver contracts
 *
 * NOTE: Both the subgraph and this indexer use upserts in this file since a 'Resolver' can be any
 * contract that emits events with the relevant signatures. The contract may not necessarily be
 * intended for use with ENS as a Resolver. Each indexed event could be the first one indexed for
 * a contract and its Resolver ID, so we cannot assume the Resolver entity already exists.
 *
 * @param pluginName the name of the plugin using these shared handlers
 */
export const makeResolverHandlers = ({ pluginName }: { pluginName: PluginName }) => {
  const sharedEventValues = makeSharedEventValues(pluginName);

  return {
    async handleAddrChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; a: Address }>;
    }) {
      const { a: address, node } = event.args;
      await upsertAccount(context, address);

      const id = makeResolverId(event.log.address, node);
      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
        addrId: address,
      });

      // materialize the Domain's resolvedAddress field iff exists and is set to this Resolver
      const domain = await context.db.find(schema.domain, { id: node });
      if (domain?.resolverId === id) {
        await context.db.update(schema.domain, { id: node }).set({ resolvedAddressId: address });
      }

      // log ResolverEvent
      await context.db.insert(schema.addrChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        addrId: address,
      });
    },

    async handleAddressChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; coinType: bigint; newAddress: Address }>;
    }) {
      const { node, coinType, newAddress } = event.args;

      const id = makeResolverId(event.log.address, node);
      const resolver = await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
      });

      // upsert the new coinType
      await context.db
        .update(schema.resolver, { id })
        .set({ coinTypes: uniq([...(resolver.coinTypes ?? []), coinType]) });

      // log ResolverEvent
      await context.db.insert(schema.multicoinAddrChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        coinType,
        addr: newAddress,
      });
    },

    async handleNameChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; name: string }>;
    }) {
      // NOTE(name-null-bytes): manually decode args that may contain null bytes
      const {
        args: { node, name },
      } = decodeEventLog({
        eventName: "NameChanged",
        abi: ENSDeployments.mainnet.root.contracts.Resolver.abi,
        topics: event.log.topics,
        data: event.log.data,
      });

      if (hasNullByte(name)) return;

      const id = makeResolverId(event.log.address, node);
      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
      });

      // log ResolverEvent
      await context.db.insert(schema.nameChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        name,
      });
    },

    async handleABIChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; contentType: bigint }>;
    }) {
      const { node, contentType } = event.args;
      const id = makeResolverId(event.log.address, node);

      // upsert resolver
      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
      });

      // log ResolverEvent
      await context.db.insert(schema.abiChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        contentType,
      });
    },

    async handlePubkeyChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; x: Hex; y: Hex }>;
    }) {
      const { node, x, y } = event.args;
      const id = makeResolverId(event.log.address, node);

      // upsert resolver
      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
      });

      // log ResolverEvent
      await context.db.insert(schema.pubkeyChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        x,
        y,
      });
    },

    async handleTextChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Node;
        indexedKey: string;
        key: string;
        value?: string;
      }>;
    }) {
      const { node, key, value } = event.args;
      const id = makeResolverId(event.log.address, node);
      const resolver = await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
      });

      // upsert new key
      await context.db
        .update(schema.resolver, { id })
        .set({ texts: uniq([...(resolver.texts ?? []), key]) });

      // log ResolverEvent
      await context.db.insert(schema.textChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        key,
        // ponder's (viem's) event parsing produces empty string for some TextChanged events
        // (which is correct) but the subgraph records null for these instances, so we coalesce
        // falsy strings to null for compatibility
        // ex: last TextChanged in tx 0x7fac4f1802c9b1969311be0412e6f900d531c59155421ff8ce1fda78b87956d0
        value: value || null,
      });
    },

    async handleContenthashChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; hash: Hash }>;
    }) {
      const { node, hash } = event.args;
      const id = makeResolverId(event.log.address, node);
      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
        contentHash: hash,
      });

      // log ResolverEvent
      await context.db.insert(schema.contenthashChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        hash,
      });
    },

    async handleInterfaceChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; interfaceID: Hex; implementer: Hex }>;
    }) {
      const { node, interfaceID, implementer } = event.args;
      const id = makeResolverId(event.log.address, node);
      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
      });

      // log ResolverEvent
      await context.db.insert(schema.interfaceChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        interfaceID,
        implementer,
      });
    },

    async handleAuthorisationChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Node;
        owner: Address;
        target: Hex;
        isAuthorised: boolean;
      }>;
    }) {
      const { node, owner, target, isAuthorised } = event.args;
      const id = makeResolverId(event.log.address, node);

      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
      });

      // log ResolverEvent
      await context.db.insert(schema.authorisationChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        owner,
        target,
        // NOTE: the spelling difference is kept for subgraph backwards-compatibility
        isAuthorized: isAuthorised,
      });
    },

    async handleVersionChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; newVersion: bigint }>;
    }) {
      const { node, newVersion } = event.args;
      const id = makeResolverId(event.log.address, node);

      // materialize the Domain's resolvedAddress field iff exists and is set to this Resolver
      const domain = await context.db.find(schema.domain, { id: node });
      if (domain?.resolverId === id) {
        await context.db.update(schema.domain, { id: node }).set({ resolvedAddressId: null });
      }

      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,

        // clear out the resolver's info on VersionChanged
        addrId: null,
        contentHash: null,
        coinTypes: null,
        texts: null,
      });

      // log ResolverEvent
      await context.db.insert(schema.versionChanged).values({
        ...sharedEventValues(context.network.chainId, event),
        resolverId: id,
        version: newVersion,
      });
    },

    async handleDNSRecordChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Node;
        name: Hex;
        resource: number;
        record: Hex;
      }>;
    }) {
      // subgraph ignores
    },

    async handleDNSRecordDeleted({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Node;
        name: Hex;
        resource: number;
        record?: Hex;
      }>;
    }) {
      // subgraph ignores
    },

    async handleDNSZonehashChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; zonehash: Hash }>;
    }) {
      // subgraph ignores
    },
  };
};
