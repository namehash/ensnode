import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address } from "viem";

import { Node } from "@ensnode/ensnode-sdk";

export async function removeNodeResolverRelation(context: Context, registry: Address, node: Node) {
  const chainId = context.chain.id;

  await context.db.delete(schema.nodeResolverRelation, { chainId, registry, node });
}

export async function upsertNodeResolverRelation(
  context: Context,
  registry: Address,
  node: Node,
  resolver: Address,
) {
  const chainId = context.chain.id;

  return context.db
    .insert(schema.nodeResolverRelation)
    .values({ chainId, registry, node, resolver })
    .onConflictDoUpdate({ resolver });
}
