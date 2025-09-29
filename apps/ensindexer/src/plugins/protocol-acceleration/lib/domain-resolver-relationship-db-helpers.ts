import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { makeDomainResolverRelationId, makeResolverId } from "@/lib/ids";
import { Node } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

export async function removeDomainResolverRelation(context: Context, node: Node) {
  await context.db.delete(schema.ext_domainResolverRelation, {
    id: makeDomainResolverRelationId(context.chain.id, node),
  });
}

export async function upsertDomainResolverRelation(
  context: Context,
  node: Node,
  resolverAddress: Address,
) {
  const id = makeDomainResolverRelationId(context.chain.id, node);
  const chainId = context.chain.id;
  const domainId = node;
  const resolverId = makeResolverId(chainId, resolverAddress, node);

  return context.db
    .insert(schema.ext_domainResolverRelation)
    .values({ id, chainId, domainId, resolverId })
    .onConflictDoUpdate({ resolverId });
}
