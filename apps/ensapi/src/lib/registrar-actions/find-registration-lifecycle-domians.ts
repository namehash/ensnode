import { inArray } from "drizzle-orm/sql";

import * as schema from "@ensnode/ensnode-schema";
import type {
  InterpretedLabel,
  InterpretedName,
  Node,
  RegistrationLifecycleDomain,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

/**
 * Find domains for selected Registration Lifecycle Nodes.
 *
 * @param nodes is array containing a list of nodes.
 * @returns Registration Lifecycle Domains for nodes.
 */
export async function findRegistrationLifecycleDomains(
  nodes: Node[],
): Promise<Record<Node, RegistrationLifecycleDomain>> {
  const records = await db
    .select({
      node: schema.subgraph_domain.id,
      labelName: schema.subgraph_domain.labelName,
      name: schema.subgraph_domain.name,
    })
    .from(schema.subgraph_domain)
    .where(inArray(schema.subgraph_domain.id, nodes));

  const registrationLifecycleDomains: Record<Node, RegistrationLifecycleDomain> = {};

  for (const record of records) {
    // Invariant: The `label` of the Domain associated with the `node` must exist.
    if (record.labelName === null) {
      throw new Error(`Domain 'label' must exists for '${record.node}' node.`);
    }

    // Invariant: The FQDN `name` of the Domain associated with the `node` must exist.
    if (!record.name === null) {
      throw new Error(`Domain 'name' must exists for '${record.node}' node.`);
    }

    registrationLifecycleDomains[record.node] = {
      subname: record.labelName as InterpretedLabel,
      name: record.name as InterpretedName,
    };
  }

  return registrationLifecycleDomains;
}
