import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { type Address, zeroAddress } from "viem";

import { makeSharedEventValues, upsertAccount, upsertResolver } from "@/lib/db-helpers";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { makeResolverId } from "@/lib/ids";
import { type EventWithArgs, healReverseAddresses } from "@/lib/ponder-helpers";
import {
  type LabelHash,
  type Node,
  PluginName,
  REVERSE_ROOT_NODES,
  ROOT_NODE,
} from "@ensnode/utils";
import {
  isLabelIndexable,
  makeSubdomainNode,
  maybeHealLabelByReverseAddress,
} from "@ensnode/utils/subname-helpers";

/**
 * Initializes the ENS root node with the zeroAddress as the owner.
 *
 * NOTE: Any permutation of plugins might be activated (except no plugins activated) and multiple
 * (i.e. every) plugin expects the ENS root to exist. To ensure that the ENS root domain exists
 * in every possible permutation of plugin activation, this function should be used as the setup
 * event handler for registry (or shadow registry) contracts. In the case there are multiple plugins
 * activated, this means `setupRootNode` will be executed multiple times and should therefore be
 * entirely idempotent (i.e. with `.onConflictDoNothing()`).
 * https://ponder.sh/docs/api-reference/indexing-functions#setup-event
 */
export async function setupRootNode({ context }: { context: Context }) {
  // Each domain must reference an account of its owner,
  // so we ensure the account exists before inserting the domain
  await upsertAccount(context, zeroAddress);

  // create the ENS root domain (if not exists)
  await context.db
    .insert(schema.domain)
    .values({
      id: ROOT_NODE,
      ownerId: zeroAddress,
      createdAt: 0n,
      // NOTE: we initialize the root node as migrated because:
      // 1. this matches subgraph's existing behavior, despite the root node not technically being
      //    migrated until the new registry is deployed and
      // 2. other plugins (Basenames, Lineanames) don't have the concept of migration but defaulting to true
      //    is a reasonable behavior
      isMigrated: true,
    })
    .onConflictDoNothing();
}

// a domain is 'empty' if it has no resolver, no owner, and no subdomains
// via https://github.com/ensdomains/ens-subgraph/blob/c844791/src/ensRegistry.ts#L65
function isDomainEmpty(domain: typeof schema.domain.$inferSelect) {
  return (
    domain.resolverId === null && domain.ownerId === zeroAddress && domain.subdomainCount === 0
  );
}

// a more accurate name for 'recurseDomainDelete'
// https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L64
async function recursivelyRemoveEmptyDomainFromParentSubdomainCount(context: Context, node: Node) {
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
        const { label: labelHash, node: parentNode, owner } = event.args;

        await upsertAccount(context, owner);

        // the domain in question is a subdomain of `parentNode`
        const node = makeSubdomainNode(labelHash, parentNode);
        let domain = await context.db.find(schema.domain, { id: node });

        // note that we set isMigrated in each branch such that if this domain is being
        // interacted with on the new registry, its migration status is set here
        if (domain) {
          // if the domain already exists, this is just an update of the owner record (& isMigrated)
          domain = await context.db
            .update(schema.domain, { id: node })
            .set({ ownerId: owner, isMigrated });
        } else {
          // otherwise create the domain (w/ isMigrated)
          domain = await context.db.insert(schema.domain).values({
            id: node,
            ownerId: owner,
            parentId: parentNode,
            createdAt: event.block.timestamp,
            labelhash: labelHash,
            isMigrated,
          });

          // and increment parent subdomainCount
          await context.db
            .update(schema.domain, { id: parentNode })
            .set((row) => ({ subdomainCount: row.subdomainCount + 1 }));
        }

        // if the domain doesn't yet have a name, attempt to construct it here
        if (!domain.name) {
          const parent = await context.db.find(schema.domain, { id: parentNode });

          let healedLabel = null;

          // 1. if healing label from reverse addresses is enabled, and the parent is a known
          //    reverse node (i.e. addr.reverse), give it a go
          if (healReverseAddresses() && REVERSE_ROOT_NODES.has(parentNode)) {
            healedLabel = maybeHealLabelByReverseAddress({
              maybeReverseAddress: owner,
              labelHash,
            });
          }

          // 2. if reverse address healing didn't work, try ENSRainbow
          if (!healedLabel) {
            // attempt to heal the label associated with labelHash via ENSRainbow
            // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L56-L61
            healedLabel = await labelByLabelHash(labelHash);
          }

          const validLabel = isLabelIndexable(healedLabel) ? healedLabel : undefined;

          // to construct `Domain.name` use the parent's name and the label value (encoded if not indexable)
          // NOTE: for the root node, the parent is null, so we just use the label value as is
          const label = validLabel || encodeLabelhash(labelHash);
          const name = parent?.name ? `${label}.${parent.name}` : label;

          // akin to domain.save()
          // via https://github.com/ensdomains/ens-subgraph/blob/c68a889e0bcdc6d45033778faef19b3efe3d15fe/src/ensRegistry.ts#L86
          await context.db.update(schema.domain, { id: node }).set({
            name,
            // NOTE: only update Domain.labelName iff label is healed and valid
            // via: https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L113
            labelName: validLabel,
          });
        }

        // garbage collect newly 'empty' domain iff necessary
        // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L85
        if (owner === zeroAddress) {
          await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
        }

        // log DomainEvent
        await context.db.insert(schema.newOwner).values({
          ...sharedEventValues(context.network.chainId, event),
          parentDomainId: parentNode,
          domainId: node,
          ownerId: owner,
        });
      },
    async handleTransfer({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; owner: Address }>;
    }) {
      const { node, owner } = event.args;

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
      await context.db.insert(schema.transfer).values({
        ...sharedEventValues(context.network.chainId, event),
        domainId: node,
        ownerId: owner,
      });
    },

    async handleNewTTL({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; ttl: bigint }>;
    }) {
      const { node, ttl } = event.args;

      // NOTE: the subgraph handles the case where the domain no longer exists, but domains are
      // never deleted, so we avoid implementing that check here
      // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L215

      await context.db.update(schema.domain, { id: node }).set({ ttl });

      // log DomainEvent
      await context.db.insert(schema.newTTL).values({
        ...sharedEventValues(context.network.chainId, event),
        domainId: node,
        ttl,
      });
    },

    async handleNewResolver({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; resolver: Address }>;
    }) {
      const { node, resolver: resolverAddress } = event.args;

      const resolverId = makeResolverId(resolverAddress, node);

      const isZeroResolver = resolverAddress === zeroAddress;

      // if zeroing out a domain's resolver, remove the reference instead of tracking a zeroAddress Resolver
      // NOTE: Resolver records are not deleted
      if (isZeroResolver) {
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

        // update the domain to point to it, and materialize the eth addr
        // NOTE: this implements the logic as documented here
        // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L193
        await context.db.update(schema.domain, { id: node }).set({
          resolverId,
          resolvedAddressId: resolver.addrId,
        });
      }

      // log DomainEvent
      await context.db.insert(schema.newResolver).values({
        ...sharedEventValues(context.network.chainId, event),
        domainId: node,
        // NOTE: this actually produces a bug in the subgraph's graphql layer — `resolver` is not nullable
        // but there is never a resolver record created for the zeroAddress. so if you query the
        // `resolver { id }` of a NewResolver event that set the resolver to zeroAddress
        // ex: newResolver(id: "3745840-2") { id resolver {id} }
        // you will receive a GraphQL type error. for subgraph compatibility we re-implement this
        // behavior here, but it should be entirely avoided in a v2 restructuring of the schema.
        resolverId: isZeroResolver ? zeroAddress : resolverId,
      });
    },
  };
};
