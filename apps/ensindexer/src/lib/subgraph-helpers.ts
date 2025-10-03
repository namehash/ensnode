import { Context } from "ponder:registry";
import schema from "ponder:schema";
import config from "@/config";
import { upsertAccount } from "@/lib/db-helpers";
import { Node, ROOT_NODE } from "@ensnode/ensnode-sdk";
import { isAddressEqual, zeroAddress } from "viem";

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
    .insert(schema.subgraph_domain)
    .values({
      id: ROOT_NODE,
      ownerId: zeroAddress,
      createdAt: 0n,

      // NOTE: we initialize the root node as migrated because:
      // 1. this matches subgraph's existing behavior, despite the root node not technically being
      //    migrated until the new registry is deployed and
      // 2. other plugins (Basenames, Lineanames) don't have the concept of migration and defaulting
      //    to true is reasonable
      isMigrated: true,

      // NOTE(replace-unnormalized, subgraph-compat): the subgraph datamodel expects that the
      // value for the root node's `name` is `null`. otherwise enforce that the root node's name is
      // the correct Interpeted Name (empty string)
      name: config.isSubgraphCompatible ? null : "",
    })
    .onConflictDoNothing();
}

// a domain is 'empty' if it has no resolver, no owner, and no subdomains
// via https://github.com/ensdomains/ens-subgraph/blob/c844791/src/ensRegistry.ts#L65
function isDomainEmpty(domain: typeof schema.subgraph_domain.$inferSelect) {
  return (
    domain.resolverId === null &&
    isAddressEqual(domain.ownerId, zeroAddress) &&
    domain.subdomainCount === 0
  );
}

// a more accurate name for 'recurseDomainDelete'
// https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ensRegistry.ts#L64
export async function recursivelyRemoveEmptyDomainFromParentSubdomainCount(
  context: Context,
  node: Node,
) {
  const domain = await context.db.find(schema.subgraph_domain, { id: node });
  if (!domain) throw new Error(`Domain not found: ${node}`);

  if (isDomainEmpty(domain) && domain.parentId !== null) {
    // decrement parent's subdomain count
    await context.db
      .update(schema.subgraph_domain, { id: domain.parentId })
      .set((row) => ({ subdomainCount: row.subdomainCount - 1 }));

    // recurse to parent
    return recursivelyRemoveEmptyDomainFromParentSubdomainCount(context, domain.parentId);
  }
}
