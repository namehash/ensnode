import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Node } from "@ensnode/utils/types";
import { Hex } from "viem";
import { createSharedEventValues, upsertAccount, upsertResolver } from "../lib/db-helpers";
import { makeResolverId } from "../lib/ids";
import { hasNullByte, uniq } from "../lib/lib-helpers";
import { EventWithArgs } from "../lib/ponder-helpers";
import { OwnedName } from "../lib/types";

// NOTE: both subgraph and this indexer use upserts in this file because a 'Resolver' is _any_
// contract on the chain that emits an event with this signature, which may or may not actually be
// a contract intended for use with ENS as a Resolver. because of this, each event could be the
// first event the indexer has seen for this contract (and its Resolver id) and therefore needs not
// assume a Resolver entity already exists

export const makeResolverHandlers = (ownedName: OwnedName) => {
  const sharedEventValues = createSharedEventValues(ownedName);

  return {
    async handleAddrChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; a: Hex }>;
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
      await context.db
        .insert(schema.addrChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          addrId: address,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleAddressChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; coinType: bigint; newAddress: Hex }>;
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
      await context.db
        .insert(schema.multicoinAddrChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          coinType,
          addr: newAddress,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleNameChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; name: string }>;
    }) {
      const { node, name } = event.args;
      if (hasNullByte(name)) return;

      const id = makeResolverId(event.log.address, node);
      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,
      });

      // log ResolverEvent
      await context.db
        .insert(schema.nameChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          name,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
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
      await context.db
        .insert(schema.abiChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          contentType,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
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
      await context.db
        .insert(schema.pubkeyChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          x,
          y,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
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
      await context.db
        .insert(schema.textChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          key,
          // ponder's (viem's) event parsing produces empty string for some TextChanged events
          // (which is correct) but the subgraph records null for these instances, so we coalesce
          // falsy strings to null for compatibility
          // ex: last TextChanged in 0x7fac4f1802c9b1969311be0412e6f900d531c59155421ff8ce1fda78b87956d0
          value: value || null,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleContenthashChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; hash: Hex }>;
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
      await context.db
        .insert(schema.contenthashChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          hash,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
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
      await context.db
        .insert(schema.interfaceChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          interfaceID,
          implementer,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleAuthorisationChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Node;
        owner: Hex;
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
      await context.db
        .insert(schema.authorisationChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          owner,
          target,
          // NOTE: the spelling difference is kept for subgraph backwards-compatibility
          isAuthorized: isAuthorised,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleVersionChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; newVersion: bigint }>;
    }) {
      // a version change nulls out the resolver
      const { node, newVersion } = event.args;
      const id = makeResolverId(event.log.address, node);
      const domain = await context.db.find(schema.domain, { id: node });

      // materialize the Domain's resolvedAddress field iff exists and is set to this Resolver
      if (domain && domain.resolverId === id) {
        await context.db.update(schema.domain, { id: node }).set({ resolvedAddressId: null });
      }

      await upsertResolver(context, {
        id,
        domainId: node,
        address: event.log.address,

        // clear out the resolver's info
        addrId: null,
        contentHash: null,
        coinTypes: null,
        texts: null,
      });

      // log ResolverEvent
      await context.db
        .insert(schema.versionChanged)
        .values({
          ...sharedEventValues(event),
          resolverId: id,
          version: newVersion,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleDNSRecordChanged({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Hex;
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
        node: Hex;
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
      event: EventWithArgs<{ node: Hex; zonehash: Hex }>;
    }) {
      // subgraph ignores
    },
  };
};
