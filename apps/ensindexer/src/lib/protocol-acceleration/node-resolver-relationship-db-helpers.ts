import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address } from "viem";

import { Node } from "@ensnode/ensnode-sdk";

export async function removeNodeResolverRelation(context: Context, node: Node) {
  const chainId = context.chain.id;

  await context.db.delete(schema.ext_nodeResolverRelation, { chainId, node });
}

export async function upsertNodeResolverRelation(context: Context, node: Node, resolver: Address) {
  const chainId = context.chain.id;

  return context.db
    .insert(schema.ext_nodeResolverRelation)
    .values({ chainId, node, resolver })
    .onConflictDoUpdate({ resolver });
}
