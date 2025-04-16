import { Context } from "ponder:registry";
// import schema from "ponder:schema";
// import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { type Address, zeroAddress } from "viem";

import { makeSharedEventValues, upsertAccount, upsertResolver } from "@/lib/db-helpers";
import { type EventWithArgs } from "@/lib/ponder-helpers";
import { type LabelHash, type Node, PluginName } from "@ensnode/utils";

/**
 * makes a set of shared handlers for a Registry contract
 *
 * @param pluginName the name of the plugin using these shared handlers
 */
export const makeRegistryHandlers = ({ pluginName }: { pluginName: PluginName }) => {
  const sharedEventValues = makeSharedEventValues(pluginName);

  return {
    handleNewOwner:
      (isMigrated: boolean) =>
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
        console.log("nothin");
      },
    // async handleTransfer({
    //   context,
    //   event,
    // }: {
    //   context: Context;
    //   event: EventWithArgs<{ node: Node; owner: Address }>;
    // }) {
    //   const { node, owner } = event.args;

    //   await upsertAccount(context, owner);

    //   // ensure domain & update owner
    //   await context.db
    //     .insert(schema.domain)
    //     .values([{ id: node, ownerId: owner, createdAt: event.block.timestamp }])
    //     .onConflictDoUpdate({ ownerId: owner });

    //   // garbage collect newly 'empty' domain iff necessary
    //   if (owner === zeroAddress) {
    //     await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
    //   }

    //   // log DomainEvent
    //   await context.db.insert(schema.transfer).values({
    //     ...sharedEventValues(context.network.chainId, event),
    //     domainId: node,
    //     ownerId: owner,
    //   });
    // },

    // async handleNewTTL({
    //   context,
    //   event,
    // }: {
    //   context: Context;
    //   event: EventWithArgs<{ node: Node; ttl: bigint }>;
    // }) {
    //   const { node, ttl } = event.args;

    //   // NOTE: the subgraph handles the case where the domain no longer exists, but domains are
    //   // never deleted, so we avoid implementing that check here
    //   // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L215

    //   await context.db.update(schema.domain, { id: node }).set({ ttl });

    //   // log DomainEvent
    //   await context.db.insert(schema.newTTL).values({
    //     ...sharedEventValues(context.network.chainId, event),
    //     domainId: node,
    //     ttl,
    //   });
    // },

    // async handleNewResolver({
    //   context,
    //   event,
    // }: {
    //   context: Context;
    //   event: EventWithArgs<{ node: Node; resolver: Address }>;
    // }) {
    //   const { node, resolver: resolverAddress } = event.args;

    //   const resolverId = makeResolverId(resolverAddress, node);

    //   const isZeroResolver = resolverAddress === zeroAddress;

    //   // if zeroing out a domain's resolver, remove the reference instead of tracking a zeroAddress Resolver
    //   // NOTE: Resolver records are not deleted
    //   if (isZeroResolver) {
    //     await context.db
    //       .update(schema.domain, { id: node })
    //       .set({ resolverId: null, resolvedAddressId: null });

    //     // garbage collect newly 'empty' domain iff necessary
    //     await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
    //   } else {
    //     // otherwise upsert the resolver
    //     const resolver = await upsertResolver(context, {
    //       id: resolverId,
    //       domainId: node,
    //       address: resolverAddress,
    //     });

    //     // update the domain to point to it, and materialize the eth addr
    //     // NOTE: this implements the logic as documented here
    //     // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L193
    //     await context.db.update(schema.domain, { id: node }).set({
    //       resolverId,
    //       resolvedAddressId: resolver.addrId,
    //     });
    //   }

    //   // log DomainEvent
    //   await context.db.insert(schema.newResolver).values({
    //     ...sharedEventValues(context.network.chainId, event),
    //     domainId: node,
    //     // NOTE: this actually produces a bug in the subgraph's graphql layer — `resolver` is not nullable
    //     // but there is never a resolver record created for the zeroAddress. so if you query the
    //     // `resolver { id }` of a NewResolver event that set the resolver to zeroAddress
    //     // ex: newResolver(id: "3745840-2") { id resolver {id} }
    //     // you will receive a GraphQL type error. for subgraph compatibility we re-implement this
    //     // behavior here, but it should be entirely avoided in a v2 restructuring of the schema.
    //     resolverId: isZeroResolver ? zeroAddress : resolverId,
    //   });
    // },
  };
};
