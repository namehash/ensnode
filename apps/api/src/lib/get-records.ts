import { Node } from "@ensnode/utils/types";
import { db } from "./db";

export async function getResolverRecords(resolverId: string, node: Node) {
  return await db.query.v2_resolverRecords.findFirst({
    // TODO: put id generation into @ensnode/utils and re-use it here for faster lookups
    where: (t, { eq, and }) => and(eq(t.resolverId, resolverId), eq(t.node, node)),
    with: { addresses: true },
  });
}
