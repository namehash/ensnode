import { and, eq, like, Param, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import {
  type ENSv1DomainId,
  type ENSv2DomainId,
  interpretedLabelsToLabelHashPath,
  type LabelHashPath,
  type Name,
  parsePartialInterpretedName,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("find-domains");

interface DomainFilter {
  name?: Name;
  owner?: Address;
}

/**
 * Find Domains by Canonical Name.
 *
 * @throws If `name` or `owner` is not provided.
 * @throws If `name` is provided but is not a valid Partial InterpretedName
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
 * 1. parse Partial InterpretedName into concrete path and partial fragment
 *   i.e. for a `name` like "sub1.sub2.paren":
 *    - concrete = ["sub1", "sub2"]
 *    - partial = 'paren'
 * 2. validate inputs
 * 3. for both v1Domains and v2Domains
 *   a. construct a subquery that filters the set of Domains to those with the specific concrete path
 *   b. if provided, filter the head domains of that path by `partial`
 *   c. if provided, filter the leaf domains of that path by `owner`
 * 4. construct a union of the two result sets and return
 */
export function findDomains({ name, owner }: DomainFilter) {
  // NOTE: if name is not provided, parse empty string to simplify control-flow, validity checked below
  // NOTE: throws if name is not a Partial InterpretedName
  const { concrete, partial } = parsePartialInterpretedName(name || "");

  logger.debug({ input: { name, owner, concrete, partial } });

  // a name input is valid if it was parsed to something other than just empty string
  const validName = concrete.length > 0 || partial !== "";
  const validOwner = owner !== undefined;

  // Invariant: one of name or owner must be provided
  // TODO: maybe this should be zod...
  if (!validName && !validOwner) {
    throw new Error(`Invariant(findDomains): One of 'name' or 'owner' must be provided.`);
  }

  const labelHashPath = interpretedLabelsToLabelHashPath(concrete);

  // compose subquery by concrete LabelHashPath
  const v1DomainsByName = v1DomainsByLabelHashPath(labelHashPath);
  const v2DomainsByName = v2DomainsByLabelHashPath(labelHashPath);

  // alias for the head domains (to get its labelHash for partial matching)
  const v1HeadDomain = alias(schema.v1Domain, "v1HeadDomain");
  const v2HeadDomain = alias(schema.v2Domain, "v2HeadDomain");

  // join on leafId (the autocomplete result), filter by owner and partial
  const v1Domains = db
    .select({ id: schema.v1Domain.id })
    .from(schema.v1Domain)
    .innerJoin(v1DomainsByName, eq(schema.v1Domain.id, v1DomainsByName.leafId))
    .innerJoin(v1HeadDomain, eq(v1HeadDomain.id, v1DomainsByName.headId))
    .innerJoin(schema.label, eq(schema.label.labelHash, v1HeadDomain.labelHash))
    .where(
      and(
        owner ? eq(schema.v1Domain.ownerId, owner) : undefined,
        partial ? like(schema.label.value, `${partial}%`) : undefined,
      ),
    );

  // join on leafId (the autocomplete result), filter by owner and partial
  const v2Domains = db
    .select({ id: schema.v2Domain.id })
    .from(schema.v2Domain)
    .innerJoin(v2DomainsByName, eq(schema.v2Domain.id, v2DomainsByName.leafId))
    .innerJoin(v2HeadDomain, eq(v2HeadDomain.id, v2DomainsByName.headId))
    .innerJoin(schema.label, eq(schema.label.labelHash, v2HeadDomain.labelHash))
    .where(
      and(
        owner ? eq(schema.v2Domain.ownerId, owner) : undefined,
        partial ? like(schema.label.value, `${partial}%`) : undefined,
      ),
    );

  // TODO: remove this, just for debugging
  Promise.all([db.select().from(v1DomainsByName), db.select().from(v2DomainsByName)]).then(
    ([v1DomainsResults, v2DomainsResults]) =>
      logger.debug({
        v1DomainsSQL: v1Domains.toSQL().sql,
        v1DomainsResults,
        v2Domains: v2Domains.toSQL().sql,
        v2DomainsResults,
      }),
  );

  // use any to ignore id column type mismatch (ENSv1DomainId & ENSv2DomainId, and raw SQL vs table column)
  const domains = db.$with("domains").as(unionAll(v1Domains, v2Domains as any));

  return domains;
}

/**
 * Compose a query for v1Domains that have the specified children path.
 *
 * For a search like "sub1.sub2.paren":
 *  - concrete = ["sub1", "sub2"]
 *  - partial = 'paren'
 *  - labelHashPath = [labelhash('sub2'), labelhash('sub1')]
 *
 * We find v1Domains matching the concrete path and return both:
 *  - leafId: the deepest child (label "sub1") - the autocomplete result, for ownership check
 *  - headId: the parent of the path (whose label should match partial "paren")
 *
 * Algorithm: Start from the deepest child (leaf) and traverse UP to find the head.
 * This is more efficient than starting from all domains and traversing down.
 */
function v1DomainsByLabelHashPath(labelHashPath: LabelHashPath) {
  // If no concrete path, return all domains (leaf = head = self)
  // Postgres will optimize this simple subquery when joined
  if (labelHashPath.length === 0) {
    return db
      .select({
        leafId: sql<ENSv1DomainId>`${schema.v1Domain.id}`.as("leafId"),
        headId: sql<ENSv1DomainId>`${schema.v1Domain.id}`.as("headId"),
      })
      .from(schema.v1Domain)
      .as("v1DomainsByName");
  }

  // https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;
  const pathLength = sql`array_length(${rawLabelHashPathArray}, 1)`;

  // Use a recursive CTE starting from the deepest child and traversing UP
  // The query:
  // 1. Starts with domains matching the leaf labelHash (deepest child)
  // 2. Recursively joins parents, verifying each ancestor's labelHash
  // 3. Returns both the leaf (for result/ownership) and head (for partial match)
  return db
    .select({
      // https://github.com/drizzle-team/drizzle-orm/issues/1242
      leafId: sql<ENSv1DomainId>`v1_path_check.leaf_id`.as("leafId"),
      headId: sql<ENSv1DomainId>`v1_path_check.head_id`.as("headId"),
    })
    .from(
      sql`(
        WITH RECURSIVE upward_check AS (
          -- Base case: find the deepest children (leaves of the concrete path)
          SELECT
            d.id AS leaf_id,
            d.parent_id AS current_id,
            1 AS depth
          FROM ${schema.v1Domain} d
          WHERE d.label_hash = (${rawLabelHashPathArray})[${pathLength}]

          UNION ALL

          -- Recursive step: traverse UP, verifying each ancestor's labelHash
          SELECT
            upward_check.leaf_id,
            pd.parent_id AS current_id,
            upward_check.depth + 1
          FROM upward_check
          JOIN ${schema.v1Domain} pd
            ON pd.id = upward_check.current_id
          WHERE upward_check.depth < ${pathLength}
            AND pd.label_hash = (${rawLabelHashPathArray})[${pathLength} - upward_check.depth]
        )
        SELECT leaf_id, current_id AS head_id
        FROM upward_check
        WHERE depth = ${pathLength}
      ) AS v1_path_check`,
    )
    .as("v1DomainsByName");
}

/**
 * Compose a query for v2Domains that have the specified children path.
 *
 * For a search like "sub1.sub2.paren":
 *  - concrete = ["sub1", "sub2"]
 *  - partial = 'paren'
 *  - labelHashPath = [labelhash('sub2'), labelhash('sub1')]
 *
 * We find v2Domains matching the concrete path and return both:
 *  - leafId: the deepest child (label "sub1") - the autocomplete result, for ownership check
 *  - headId: the parent of the path (whose label should match partial "paren")
 *
 * Algorithm: Start from the deepest child (leaf) and traverse UP via registryCanonicalDomain.
 * For v2, parent relationship is: domain.registryId -> registryCanonicalDomain -> parent domainId
 */
function v2DomainsByLabelHashPath(labelHashPath: LabelHashPath) {
  // If no concrete path, return all domains (leaf = head = self)
  // Postgres will optimize this simple subquery when joined
  if (labelHashPath.length === 0) {
    return db
      .select({
        leafId: sql<ENSv2DomainId>`${schema.v2Domain.id}`.as("leafId"),
        headId: sql<ENSv2DomainId>`${schema.v2Domain.id}`.as("headId"),
      })
      .from(schema.v2Domain)
      .as("v2DomainsByName");
  }

  // https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;
  const pathLength = sql`array_length(${rawLabelHashPathArray}, 1)`;

  // Use a recursive CTE starting from the deepest child and traversing UP
  // The query:
  // 1. Starts with domains matching the leaf labelHash (deepest child)
  // 2. Recursively joins parents via registryCanonicalDomain, verifying each ancestor's labelHash
  // 3. Returns both the leaf (for result/ownership) and head (for partial match)
  return db
    .select({
      // https://github.com/drizzle-team/drizzle-orm/issues/1242
      leafId: sql<ENSv2DomainId>`v2_path_check.leaf_id`.as("leafId"),
      headId: sql<ENSv2DomainId>`v2_path_check.head_id`.as("headId"),
    })
    .from(
      sql`(
        WITH RECURSIVE upward_check AS (
          -- Base case: find the deepest children (leaves of the concrete path)
          -- and get their parent via registryCanonicalDomain
          SELECT
            d.id AS leaf_id,
            rcd.domain_id AS current_id,
            1 AS depth
          FROM ${schema.v2Domain} d
          JOIN ${schema.registryCanonicalDomain} rcd
            ON rcd.registry_id = d.registry_id
          WHERE d.label_hash = (${rawLabelHashPathArray})[${pathLength}]

          UNION ALL

          -- Recursive step: traverse UP via registryCanonicalDomain
          SELECT
            upward_check.leaf_id,
            rcd.domain_id AS current_id,
            upward_check.depth + 1
          FROM upward_check
          JOIN ${schema.v2Domain} pd
            ON pd.id = upward_check.current_id
          JOIN ${schema.registryCanonicalDomain} rcd
            ON rcd.registry_id = pd.registry_id
          WHERE upward_check.depth < ${pathLength}
            AND pd.label_hash = (${rawLabelHashPathArray})[${pathLength} - upward_check.depth]
        )
        SELECT leaf_id, current_id AS head_id
        FROM upward_check
        WHERE depth = ${pathLength}
      ) AS v2_path_check`,
    )
    .as("v2DomainsByName");
}
