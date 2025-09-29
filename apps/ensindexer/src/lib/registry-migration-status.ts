import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Node } from "@ensnode/ensnode-sdk";

/**
 * Retrieves from the subgraph plugin whether the node's has migrated to the new Regsitry.
 */
export async function subgraph_nodeIsMigrated(context: Context, node: Node) {
  const domain = await context.db.find(schema.domain, { id: node });
  return domain?.isMigrated ?? false;
}
