import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { Block } from "ponder";
import { type Hex, zeroAddress } from "viem";
import { makeResolverId } from "../lib/ids";
import { ROOT_NODE, makeSubnodeNamehash } from "../lib/subname-helpers";
import { ensureDomainExists, upsertAccount } from "../lib/upserts";

/**
 * Initialize the ENS root node with the zeroAddress as the owner.
 * Any permutation of plugins might be activated and multiple plugins expect
 * the ENS root to exist. This behavior is consistent with the ens-subgraph,
 * which initializes the ENS root node in the same way. However,
 * the ens-subgraph does not have independent plugins. In our case, we have
 * multiple plugins that might be activated independently. Regardless of
 * the permutation of active plugins, they all expect the ENS root to exist.
 *
 * This function has to be used a callback on the Ponder's setup event handler.
 * https://ponder.sh/docs/api-reference/indexing-functions#setup-event
 * In case there are multiple setup handlers defined, the order of execution
 * is guaranteed to be the same, and it is the reverse order of
 * the network name configured on a given contract that the setup event was
 * registered for.
 *
 * For example, for setup events registered for contracts on: base, linea, mainnet
 * The order of execution will be: mainnet, linea, base. And if the contracts
 * were registered on: base, ethereum, linea, the order of execution will be:
 * linea, ethereum, base.
 */
export async function setupRootNode({ context }: { context: Context }) {
  // ensure we have an account for the zeroAddress
  await upsertAccount(context, zeroAddress);

  // initialize the ENS root to be owned by the zeroAddress and not migrated
  await ensureDomainExists(context, {
    id: ROOT_NODE,
    ownerId: zeroAddress,
    createdAt: 0n,
    isMigrated: false,
  });
}

function isDomainEmpty(domain: typeof schema.domain.$inferSelect) {
  return (
    domain.resolverId === null && domain.ownerId === zeroAddress && domain.subdomainCount === 0
  );
}

// a more accurate name for the following function
// https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L64
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

export async function handleTransfer({
  context,
  event,
}: {
  context: Context;
  event: {
    args: { node: Hex; owner: Hex };
    block: Block;
  };
}) {
  const { node, owner } = event.args;

  // ensure owner account
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

  // TODO: log DomainEvent
}

export const handleNewOwner =
  (isMigrated: boolean) =>
  async ({
    context,
    event,
  }: {
    context: Context;
    event: {
      args: { node: Hex; label: Hex; owner: Hex };
      block: Block;
    };
  }) => {
    const { label, node, owner } = event.args;

    const subnode = makeSubnodeNamehash(node, label);

    // ensure owner
    await upsertAccount(context, owner);

    // note that we set isMigrated so that if this domain is being interacted with on the new registry, its migration status is set here
    let domain = await context.db.find(schema.domain, { id: subnode });
    if (domain) {
      // if the domain already exists, this is just an update of the owner record (& isMigrated)
      await context.db.update(schema.domain, { id: domain.id }).set({ ownerId: owner, isMigrated });
    } else {
      // otherwise create the domain
      domain = await context.db.insert(schema.domain).values({
        id: subnode,
        ownerId: owner,
        parentId: node,
        createdAt: event.block.timestamp,
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

      // TODO: implement sync rainbow table lookups
      // https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L111
      const labelName = encodeLabelhash(label);
      const name = parent?.name ? `${labelName}.${parent.name}` : labelName;

      await context.db.update(schema.domain, { id: domain.id }).set({ name, labelName });
    }

    // garbage collect newly 'empty' domain iff necessary
    if (owner === zeroAddress) {
      await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, domain.id);
    }
  };

export async function handleNewTTL({
  context,
  event,
}: {
  context: Context;
  event: {
    args: { node: Hex; ttl: bigint };
  };
}) {
  const { node, ttl } = event.args;

  // TODO: handle the edge case in which the domain no longer exists?
  // https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L215
  // NOTE: i'm not sure this needs to be here, as domains are never deleted (??)
  await context.db.update(schema.domain, { id: node }).set({ ttl });

  // TODO: log DomainEvent
}

export async function handleNewResolver({
  context,
  event,
}: {
  context: Context;
  event: {
    args: { node: Hex; resolver: Hex };
  };
}) {
  const { node, resolver: resolverAddress } = event.args;

  // if zeroing out a domain's resolver, remove the reference instead of tracking a zeroAddress Resolver
  // NOTE: old resolver resources are kept for event logs
  if (event.args.resolver === zeroAddress) {
    await context.db.update(schema.domain, { id: node }).set({ resolverId: null });

    // garbage collect newly 'empty' domain iff necessary
    await recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, node);
  } else {
    // otherwise upsert the resolver
    const resolverId = makeResolverId(node, resolverAddress);

    const resolver = await context.db
      .insert(schema.resolver)
      .values({
        id: resolverId,
        domainId: event.args.node,
        address: event.args.resolver,
      })
      .onConflictDoNothing();

    // update the domain to point to it, and denormalize the eth addr
    await context.db
      .update(schema.domain, { id: node })
      .set({ resolverId, resolvedAddress: resolver?.addrId });
  }

  // TODO: log DomainEvent
}
