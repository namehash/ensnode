import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { ROOT_NODE, isLabelIndexable, makeSubnodeNamehash } from "@ensnode/utils/subname-helpers";
import type { Labelhash, Node } from "@ensnode/utils/types";
import { type Hex, zeroAddress } from "viem";
import { createSharedEventValues, upsertAccount, upsertResolver } from "../lib/db-helpers";
import { labelByHash } from "../lib/graphnode-helpers";
import { makeResolverId } from "../lib/ids";
import { EventWithArgs } from "../lib/ponder-helpers";
import { OwnedName } from "../lib/types";

/**
 * Initialize the ENS root node with the zeroAddress as the owner.
 * Any permutation of plugins might be activated (except no plugins activated)
 * and multiple plugins expect the ENS root to exist. This behavior is
 * consistent with the ens-subgraph, which initializes the ENS root node in
 * the same way. However, the ens-subgraph does not have independent plugins.
 * In our case, we have multiple plugins that might be activated independently.
 * Regardless of the permutation of active plugins, they all expect
 * the ENS root to exist.
 *
 * This function should be used as the setup event handler for registry
 * (or shadow registry) contracts.
 * https://ponder.sh/docs/api-reference/indexing-functions#setup-event
 * In case there are multiple plugins activated, `setupRootNode` will be
 * executed multiple times. The order of execution of `setupRootNode` is
 * deterministic based on the reverse order of the network names of the given
 * contracts associated with the activated plugins. For example,
 * if the network names were: `base`, `linea`, `mainnet`, the order of execution
 * will be: `mainnet`, `linea`, `base`.
 * And if the network names were: `base`, `ethereum`, `linea`, the order of
 * execution will be: `linea`, `ethereum`, `base`.
 */
export async function setupRootNode({ context }: { context: Context }) {
  // Each domain must reference an account of its owner,
  // so we ensure the account exists before inserting the domain
  await upsertAccount(context, zeroAddress);

  // initialize the ENS root to be owned by the zeroAddress and not migrated
  await context.db
    .insert(schema.domain)
    .values({
      id: ROOT_NODE,
      ownerId: zeroAddress,
      createdAt: 0n,
      // NOTE: we initialize the root node as migrated because:
      // 1. this matches subgraph's existing behavior, despite the root node not technically being
      //    migrated until the new registry is deployed and
      // 2. other plugins (base, linea) don't have the concept of migration but defaulting to true
      //    is a reasonable behavior
      isMigrated: true,
    })
    // only insert the domain entity into the database if it doesn't already exist
    .onConflictDoNothing();
}

function isDomainEmpty(domain: typeof schema.domain.$inferSelect) {
  return (
    domain.resolverId === null && domain.ownerId === zeroAddress && domain.subdomainCount === 0
  );
}

// a more accurate name for the following function
// https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L64
async function recursivelyRemoveEmptyDomainFromParentSubdomainCount(context: Context, node: Hex) {
  const domain = await context.db.find(schema.domain, { id: node });
  if (!domain) throw new Error(`Domain not found: ${node}`);

  if (isDomainEmpty(domain) && domain.parentId !== null) {
    // decrement parent's subdomain count
    await context.db
      .update(schema.domain, { id: domain.parentId })
      .set((row) => ({ subdomainCount: row.subdomainCount - 1 }));

    // recurse to parent
    return recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, domain.parentId);
  }
}

export const makeRegistryHandlers = (ownedName: OwnedName) => {
  const sharedEventValues = createSharedEventValues(ownedName);

  return {
    handleNewOwner:
      (isMigrated: boolean) =>
      async ({
        context,
        event,
      }: {
        context: Context;
        event: EventWithArgs<{ node: Node; label: Labelhash; owner: Hex }>;
      }) => {
        const { label: labelhash, node, owner } = event.args;

        await upsertAccount(context, owner);

        // the domain in question is a subdomain of `node` with label `labelhash`
        const subnode = makeSubnodeNamehash(node, labelhash);
        let domain = await context.db.find(schema.domain, { id: subnode });

        // note that we set isMigrated in each branch such that if this domain is being
        // interacted with on the new registry, its migration status is set here
        if (domain) {
          // if the domain already exists, this is just an update of the owner record (& isMigrated)
          await context.db
            .update(schema.domain, { id: domain.id })
            .set({ ownerId: owner, isMigrated });
        } else {
          // otherwise create the domain (w/ isMigrated)
          domain = await context.db.insert(schema.domain).values({
            id: subnode,
            ownerId: owner,
            parentId: node,
            createdAt: event.block.timestamp,
            labelhash: event.args.label,
            isMigrated,
          });

          // and increment parent subdomainCount
          await context.db
            .update(schema.domain, { id: node })
            .set((row) => ({ subdomainCount: row.subdomainCount + 1 }));
        }

        // if the domain doesn't yet have a name, construct it here
        if (!domain.name) {
          const parent = await context.db.find(schema.domain, { id: node });

          // attempt to heal the label associated with labelhash via ENSRainbow
          // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L112-L116
          const healedLabel = await labelByHash(labelhash);
          const validLabel = isLabelIndexable(healedLabel) ? healedLabel : undefined;

          // to construct `Domain.name` use the parent's name and the label value (encoded if not indexable)
          // NOTE: for the root node, the parent is null, so we just use the label value as is
          const label = validLabel || encodeLabelhash(labelhash);
          const name = parent?.name ? `${label}.${parent.name}` : label;

          // akin to domain.save()
          // via https://github.com/ensdomains/ens-subgraph/blob/c68a889e0bcdc6d45033778faef19b3efe3d15fe/src/ensRegistry.ts#L86
          await context.db.update(schema.domain, { id: domain.id }).set({
            name,
            // NOTE: only update Domain.labelName iff label is healed and valid
            // via: https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L113
            labelName: validLabel,
          });
        }

        // garbage collect newly 'empty' domain iff necessary
        // akin to https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L85
        if (owner === zeroAddress) {
          await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, domain.id);
        }

        // log DomainEvent
        await context.db
          .insert(schema.newOwner)
          .values({
            ...sharedEventValues(event),

            parentDomainId: node,
            domainId: subnode,
            ownerId: owner,
          })
          .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
      },
    async handleTransfer({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Hex; owner: Hex }>;
    }) {
      const { node, owner } = event.args;

      // Each domain must reference an account of its owner,
      // so we ensure the account exists before inserting the domain
      await upsertAccount(context, owner);

      // ensure domain & update owner
      await context.db
        .insert(schema.domain)
        .values([{ id: node, ownerId: owner, createdAt: event.block.timestamp }])
        .onConflictDoUpdate({ ownerId: owner });

      // garbage collect newly 'empty' domain iff necessary
      if (owner === zeroAddress) {
        await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
      }

      // log DomainEvent
      await context.db
        .insert(schema.transfer)
        .values({
          ...sharedEventValues(event),
          domainId: node,
          ownerId: owner,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleNewTTL({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; ttl: bigint }>;
    }) {
      const { node, ttl } = event.args;

      // TODO: handle the edge case in which the domain no longer exists?
      // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L215
      // NOTE: i'm not sure this needs to be here, as domains are never deleted (??)
      await context.db.update(schema.domain, { id: node }).set({ ttl });

      // log DomainEvent
      await context.db
        .insert(schema.newTTL)
        .values({
          ...sharedEventValues(event),
          domainId: node,
          ttl,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleNewResolver({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; resolver: Hex }>;
    }) {
      const { node, resolver: resolverAddress } = event.args;

      const resolverId = makeResolverId(resolverAddress, node);

      // if zeroing out a domain's resolver, remove the reference instead of tracking a zeroAddress Resolver
      // NOTE: old resolver resources are kept for event logs
      if (resolverAddress === zeroAddress) {
        await context.db
          .update(schema.domain, { id: node })
          .set({ resolverId: null, resolvedAddressId: null });

        // garbage collect newly 'empty' domain iff necessary
        await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
      } else {
        // otherwise upsert the resolver
        const resolver = await upsertResolver(context, {
          id: resolverId,
          domainId: node,
          address: resolverAddress,
        });

        // update the domain to point to it, and denormalize the eth addr
        // NOTE: this implements the logic as documented here
        // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L193
        await context.db
          .update(schema.domain, { id: node })
          .set({ resolverId, resolvedAddressId: resolver.addrId });
      }

      // log DomainEvent
      await context.db
        .insert(schema.newResolver)
        .values({
          ...sharedEventValues(event),
          domainId: node,
          // NOTE: this actually produces a bug in the subgraph's graphql layer — `resolver` is not nullable
          // but there is never a resolver record created for the zeroAddress. so if you query the
          // `resolver { id }` of a NewResolver event that set the resolver to zeroAddress
          // ex: newResolver(id: "3745840-2") { id resolver {id} }
          // you will receive a GraphQL type error. for subgraph compatibility we re-implement this
          // behavior here, but it should be entirely avoided in a v2 restructuring of the schema.
          resolverId: resolverAddress === zeroAddress ? zeroAddress : resolverId,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },
  };
};
