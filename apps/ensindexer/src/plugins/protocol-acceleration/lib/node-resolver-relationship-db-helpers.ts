import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address } from "viem";

import { Node } from "@ensnode/ensnode-sdk";

import { makeNodeResolverRelationId } from "./ids";

export async function removeDomainResolverRelation(context: Context, node: Node) {
  await context.db.delete(schema.ext_nodeResolverRelation, {
    id: makeNodeResolverRelationId(context.chain.id, node),
  });
}

export async function upsertDomainResolverRelation(
  context: Context,
  node: Node,
  resolverAddress: Address,
) {
  const id = makeNodeResolverRelationId(context.chain.id, node);
  const chainId = context.chain.id;

  return context.db
    .insert(schema.ext_nodeResolverRelation)
    .values({ id, chainId, node, resolverAddress })
    .onConflictDoUpdate({ resolverAddress });
}
