import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { ROOT_NODE, isLabelIndexable, makeSubnodeNamehash } from "ensnode-utils/subname-helpers";
import type { Labelhash, Node } from "ensnode-utils/types";
import { type Hex, zeroAddress } from "viem";
import { createSharedEventValues, upsertAccount, upsertResolver } from "../lib/db-helpers";
import { labelByHash } from "../lib/graphnode-helpers";
import { makeResolverId } from "../lib/ids";
import { EventWithArgs } from "../lib/ponder-helpers";
import { OwnedName } from "../lib/types";

type Domain = typeof schema.domain.$inferInsert;
type Resolver = typeof schema.resolver.$inferInsert;

const EMPTY_ADDRESS = zeroAddress;

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

// direct port of the following function
// https://github.com/ensdomains/ens-subgraph/blob/c68a889e0bcdc6d45033778faef19b3efe3d15fe/src/ensRegistry.ts#L64-L82
async function recurseDomainDelete(context: Context, domain: Domain) {
  if (
    (domain.resolverId == null || domain.resolverId!.split("-")[0] === EMPTY_ADDRESS) &&
    domain.ownerId === EMPTY_ADDRESS &&
    domain.subdomainCount === 0
  ) {
    const parentDomain = await context.db.find(schema.domain, {
      id: domain.parentId!,
    });
    if (parentDomain !== null) {
      await context.db
        .update(schema.domain, { id: domain.parentId! })
        .set((row) => ({ subdomainCount: row.subdomainCount - 1 }));
      return recurseDomainDelete(context, parentDomain);
    }

    return null;
  }

  return domain.id;
}

// create a basic domain database entity object
// akin to new Domain(node)
function newDomain(node: Node): Domain {
  return {
    id: node,
  } as Domain;
}

// create a domain database entity object
// akin to https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L34-L44
function createDomain(node: Node, timestamp: bigint): Domain {
  let domain = newDomain(node);
  if (node == ROOT_NODE) {
    domain = newDomain(node);
    domain.ownerId = EMPTY_ADDRESS;
    domain.isMigrated = true;
    domain.createdAt = timestamp;
    domain.subdomainCount = 0;
  }
  return domain;
}

// get the domain database entity object
// akin to https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L46-L56
async function getDomain(
  context: Context,
  node: Node,
  timestamp: bigint = 0n,
): Promise<Domain | null> {
  let domain = await context.db.find(schema.domain, { id: node });
  if (domain == null && node == ROOT_NODE) {
    return createDomain(node, timestamp);
  } else {
    return domain;
  }
}

// upsert the domain database entity object
// akin to https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L84-L87
async function saveDomain(context: Context, domain: Domain): Promise<void> {
  await recurseDomainDelete(context, domain);

  // insert or update the domain database entity object
  await context.db
    .insert(schema.domain)
    .values(domain)
    .onConflictDoUpdate(() => domain);
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
        const { label, node, owner } = event.args;

        // Each domain must reference an account of its owner,
        // so we ensure the account exists before inserting the domain
        // akin to https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L91-L92
        await upsertAccount(context, owner);

        // akin to https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L94-L96
        const subnode = makeSubnodeNamehash(node, label);
        let domain = await getDomain(context, subnode);
        let parent = await getDomain(context, node);

        // creating a new domain, akin to
        // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L98-L102
        if (domain === null) {
          // prepare domain entity object
          domain = newDomain(subnode);
          domain.createdAt = event.block.timestamp;
          domain.subdomainCount = 0;
        }

        // increment subdomainCount of parent domain, akin to
        // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L104-L107
        if (domain.parentId === null && parent !== null) {
          await context.db
            .update(schema.domain, { id: parent.id })
            .set((parent) => ({ subdomainCount: parent.subdomainCount + 1 }));
        }

        // setting the domain's name and labelName, akin to
        // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L109-L129
        if (domain.name === null) {
          // attempt to heal the label associated with labelhash via ENSRainbow
          // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L112-L116
          let label = await labelByHash(event.args.label);
          if (isLabelIndexable(label)) {
            domain.labelName = label;
          } else {
            label = encodeLabelhash(event.args.label);
          }
          // deciding domain's name, akin to
          // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L117-L128
          if (
            event.args.node === "0x0000000000000000000000000000000000000000000000000000000000000000"
          ) {
            // node value equals to namehash(''), use the label for the domain name
            domain.name = label;
          } else {
            let name = parent?.name;
            if (label && name) {
              domain.name = `${label}.${name}`;
            }
          }
        }

        domain.ownerId = event.args.owner;
        domain.parentId = event.args.node;
        domain.labelhash = event.args.label;
        // note that we set isMigrated so that if this domain is being interacted with
        // on the new registry, its migration status is set here
        domain.isMigrated = isMigrated;
        // akin to https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L135
        await saveDomain(context, domain);

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

      let domain = await getDomain(context, node);

      // domain should exists if it's being transferred
      if (domain === null) {
        throw new Error(`Domain ${node} does not exist`);
      }

      // update the domain owner
      // akin to https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L156-L157
      domain.ownerId = owner;
      await saveDomain(context, domain);

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
      // https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L215
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
      let id: string | null;

      // if resolver is set to 0x0, set id to null
      // we don't want to create a resolver entity for 0x0
      if (event.args.resolver === zeroAddress) {
        id = null;
      } else {
        id = makeResolverId(event.args.resolver, event.args.node);
      }

      let node = event.args.node;
      let domain = await getDomain(context, node)!;

      if (domain === null) {
        throw new Error(`Domain ${node} does not exist`);
      }

      domain.resolverId = id;

      if (id) {
        let resolver = (await context.db.find(schema.resolver, {
          id,
        })) as Resolver | null;
        if (resolver == null) {
          resolver = { id } as Resolver;
          resolver.domainId = event.args.node;
          resolver.address = event.args.resolver;
          await upsertResolver(context, resolver);
          // since this is a new resolver entity, there can't be a resolved address yet so set to null
          domain.resolvedAddressId = null;
        } else {
          domain.resolvedAddressId = resolver.addrId;
        }
      } else {
        domain.resolvedAddressId = null;
      }
      await saveDomain(context, domain);

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
          resolverId: id || zeroAddress,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },
  };
};
