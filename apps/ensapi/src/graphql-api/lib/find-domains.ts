import { eq, Param, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import {
  type ENSv1DomainId,
  interpretedLabelsToLabelHashPath,
  type Name,
  parsePartialInterpretedName,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

interface DomainFilter {
  name?: Name;
  owner?: Address;
}

/**
 * Find Domains by Canonical Name.
 *
 * ## Terminology:
 *
 * - a 'Canonical Domain' is a Domain connected to either the ENSv1 Root or the ENSv2 Root. All ENSv1
 *  Domains are Canonical Domains, but an ENSv2 Domain may not be Canonical, for example if it exists
 *  in a disjoint nametree or its Registry does not declare a Canonical Domain.
 * - a 'Partial InterpretedName' is a partial InterpretedName (ex: 'examp', 'example.', 'sub1.sub2.paren')
 *
 * ## Background:
 *
 * Materializing the set of Canonical Names in ENSv2 is non-trivial and more or less impossible
 * within the confines of Ponder's cache semantics. Additionally retroactive label healing (due to
 * new labels being discovered on-chain) is likely impossible within those constraints as well. If we
 * were to implement a naive cache-unfriendly version of canonical name materialization, indexing time
 * would increase dramatically.
 *
 * The overall user story we're trying to support is 'autocomplete' or 'search (my) domains'. More
 * specifically, given a partial InterpretedName as input (ex: 'examp', 'example.', 'sub1.sub2.paren'),
 * produce a set of Domains addressable by the provided partial InterpretedName.
 *
 * While complicated to do so, it is more correct to perform this calculation at query-time rather
 * than at index-time, given the constraints above.
 *
 * ## Algorithm
 *
 * - 'og.shru' as input.
 * - start with all domains that are addressable by the completed portion
 *   - must support recursion like `sub1.sub2.pare`
 * - given that set of domains, then find domains addressable by that path for whom the next step
 *   is LIKE the partial label joined against both domains tables
 * - find all labels like leaf with index
 * - join into both domains tables to find all domains that use that label
 * - filter by domains that
 * - then for each domain, validate
 */
export function findDomains({ name, owner }: DomainFilter) {
  // NOTE: if name is not provided, parse empty string to simplify control-flow
  // NOTE: throws if name is not a Partial InterpretedName
  const { concrete, partial } = parsePartialInterpretedName(name || "");

  // a name input is valid if it was parsed to something other than just empty string
  const validName = concrete.length > 0 || partial !== "";
  const validOwner = owner !== undefined;

  // Invariant: one of name or owner must be provided
  // TODO: maybe this should be zod...
  if (!validName && !validOwner) {
    throw new Error(`Invariant(findDomains): One of 'name' or 'owner' must be provided.`);
  }

  // compose a v1Domain subquery by name
  const v1DomainsByName = findV1DomainsByName(name);

  // filter by owner
  // TODO: filter by partial
  const v1Domains = db
    .select({ id: schema.v1Domain.id })
    .from(schema.v1Domain)
    .innerJoin(v1DomainsByName, eq(schema.v1Domain.id, v1DomainsByName.unambiguousId))
    .where(owner ? eq(schema.v1Domain.ownerId, owner) : undefined);

  // TODO: implement v2Domains search with canonical path constraint
  const v2Domains = findV2Domains({ name, owner });

  // use any to ignore id column type mismatch (ENSv1DomainId & ENSv2DomainId, and raw SQL vs table column)
  const domains = db.$with("domains").as(unionAll(v1Domains, v2Domains as any));

  return domains;
}

/**
 * Compose a query for v1Domains that have the specified children path.
 *
 * For a search like "sub.example.et":
 *  - concrete = ["sub", "example"]
 *  - partial = 'et'
 *  - labelHashPath = [labelhash('example'), labelhash('sub')]
 *
 * We find v1Domains where the Domain's descendants match the labelHashPath:
 *  - Domain D (returned)
 *  - D has child with label_hash = labelHashPath[1] (example)
 *  - That child has child with label_hash = labelHashPath[2] (sub)
 *
 * Algorithm: Start from the deepest child (leaf) and traverse UP to find candidates.
 * This is more efficient than starting from all domains and traversing down.
 */
function findV1DomainsByName(name: DomainFilter["name"]) {
  const { concrete } = parsePartialInterpretedName(name || "");

  // If no concrete labels, return all v1Domains (optionally filtered by owner)
  // if (concrete.length === 0) {
  //   return db.select({ id: schema.v1Domain.id }).from(schema.v1Domain);
  // }

  // Get the labelHashPath from concrete labels (reversed: parent-most first)
  const labelHashPath = interpretedLabelsToLabelHashPath(concrete);

  // https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;
  const pathLength = sql`array_length(${rawLabelHashPathArray}, 1)`;

  // Use a recursive CTE starting from the deepest child and traversing UP
  // The query:
  // 1. Starts with domains matching the leaf labelHash (deepest child)
  // 2. Recursively joins parents, verifying each ancestor's labelHash
  // 3. Returns the parent domain after traversing the full path (the candidate)
  return db
    .select({
      // https://github.com/drizzle-team/drizzle-orm/issues/1242
      unambiguousId: sql<ENSv1DomainId>`v1_path_check.candidate_id`.as("unambiguousId"),
    })
    .from(
      sql`(
        WITH RECURSIVE upward_check AS (
          -- Base case: find the deepest children (leaves of the concrete path)
          SELECT
            d.parent_id AS current_id,
            1 AS depth
          FROM ${schema.v1Domain} d
          WHERE d.label_hash = (${rawLabelHashPathArray})[${pathLength}]

          UNION ALL

          -- Recursive step: traverse UP, verifying each ancestor's labelHash
          SELECT
            pd.parent_id AS current_id,
            upward_check.depth + 1
          FROM upward_check
          JOIN ${schema.v1Domain} pd
            ON pd.id = upward_check.current_id
          WHERE upward_check.depth < ${pathLength}
            AND pd.label_hash = (${rawLabelHashPathArray})[${pathLength} - upward_check.depth]
        )
        SELECT current_id AS candidate_id
        FROM upward_check
        WHERE depth = ${pathLength}
      ) AS v1_path_check`,
    )
    .as("v1DomainsByName");
}

// TODO: implement v2Domains search with canonical path constraint
function findV2Domains({ owner }: DomainFilter) {
  return db
    .select({ id: schema.v2Domain.id })
    .from(schema.v2Domain)
    .where(owner ? eq(schema.v2Domain.ownerId, owner) : undefined);
}
