import { and, asc, desc, eq, like, Param, type SQL, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";
import type { Address } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import {
  type DomainId,
  type ENSv1DomainId,
  type ENSv2DomainId,
  interpretedLabelsToLabelHashPath,
  type LabelHashPath,
  type Name,
  parsePartialInterpretedName,
} from "@ensnode/ensnode-sdk";

import type { DomainsOrderBy } from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";
import { db } from "@/lib/db";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("find-domains");

const MAX_DEPTH = 16;

interface DomainFilter {
  name?: Name | undefined | null;
  owner?: Address | undefined | null;
}

/**
 * Find Domains by Canonical Name.
 *
 * @throws if neither `name` or `owner` are provided
 * @throws if `name` is provided but is not a valid Partial InterpretedName
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

  // validate depth to prevent arbitrary recursion in CTEs
  if (concrete.length > MAX_DEPTH) {
    throw new Error(`Invariant(findDomains): Name depth exceeds maximum of ${MAX_DEPTH} labels.`);
  }

  logger.debug({ input: { name, owner, concrete, partial } });

  // a name input is valid if it was parsed to something other than just empty string
  const validName = concrete.length > 0 || partial !== "";
  const validOwner = !!owner;

  // Invariant: one of name or owner must be provided
  // TODO: maybe this should be zod...
  if (!validName && !validOwner) {
    throw new Error(`Invariant(findDomains): One of 'name' or 'owner' must be provided.`);
  }

  const labelHashPath = interpretedLabelsToLabelHashPath(concrete);

  // compose subquery by concrete LabelHashPath
  const v1DomainsByLabelHashPathQuery = v1DomainsByLabelHashPath(labelHashPath);
  const v2DomainsByLabelHashPathQuery = v2DomainsByLabelHashPath(labelHashPath);

  // alias for the head domains (to get its labelHash for partial matching)
  const v1HeadDomain = alias(schema.v1Domain, "v1HeadDomain");
  const v2HeadDomain = alias(schema.v2Domain, "v2HeadDomain");

  // Base subqueries: extract unified structure from v1 and v2 domains
  // Returns {id, ownerId, leafLabelHash, headLabelHash} for each matching domain
  const v1DomainsBase = db
    .select({
      id: sql<DomainId>`${schema.v1Domain.id}`.as("id"),
      ownerId: schema.v1Domain.ownerId,
      leafLabelHash: schema.v1Domain.labelHash,
      headLabelHash: v1HeadDomain.labelHash,
    })
    .from(schema.v1Domain)
    .innerJoin(
      v1DomainsByLabelHashPathQuery,
      eq(schema.v1Domain.id, v1DomainsByLabelHashPathQuery.leafId),
    )
    .innerJoin(v1HeadDomain, eq(v1HeadDomain.id, v1DomainsByLabelHashPathQuery.headId));

  const v2DomainsBase = db
    .select({
      id: sql<DomainId>`${schema.v2Domain.id}`.as("id"),
      ownerId: schema.v2Domain.ownerId,
      leafLabelHash: schema.v2Domain.labelHash,
      headLabelHash: v2HeadDomain.labelHash,
    })
    .from(schema.v2Domain)
    .innerJoin(
      v2DomainsByLabelHashPathQuery,
      eq(schema.v2Domain.id, v2DomainsByLabelHashPathQuery.leafId),
    )
    .innerJoin(v2HeadDomain, eq(v2HeadDomain.id, v2DomainsByLabelHashPathQuery.headId));

  // Union v1 and v2 base queries into a single CTE
  const domainsBase = db.$with("domainsBase").as(unionAll(v1DomainsBase, v2DomainsBase));

  // alias for head label (for partial matching) and leaf label (for NAME ordering)
  const headLabel = alias(schema.label, "headLabel");
  const leafLabel = alias(schema.label, "leafLabel");

  // subquery for latest registration per domain (highest index)
  // TODO: replace this with a JOIN against the latest registration lookup table after
  // https://github.com/namehash/ensnode/issues/1594
  const latestRegistration = db
    .select({
      domainId: schema.registration.domainId,
      start: schema.registration.start,
      expiry: schema.registration.expiry,
    })
    .from(schema.registration)
    .where(
      eq(
        schema.registration.index,
        db
          .select({ maxIndex: sql<number>`MAX(${schema.registration.index})` })
          .from(schema.registration)
          .where(eq(schema.registration.domainId, schema.registration.domainId)),
      ),
    )
    .as("latestRegistration");

  // Apply shared joins and filters on the unified domain base
  const domains = db
    .with(domainsBase)
    .select({
      id: domainsBase.id,
      // for NAME ordering
      leafLabelValue: sql<string | null>`${leafLabel.value}`.as("leafLabelValue"),
      // for REGISTRATION_TIMESTAMP ordering
      registrationStart: sql<bigint | null>`${latestRegistration.start}`.as("registrationStart"),
      // for REGISTRATION_EXPIRY ordering
      registrationExpiry: sql<bigint | null>`${latestRegistration.expiry}`.as("registrationExpiry"),
    })
    .from(domainsBase)
    // join head label for partial matching
    .leftJoin(headLabel, eq(headLabel.labelHash, domainsBase.headLabelHash))
    // join leaf label for NAME ordering
    .leftJoin(leafLabel, eq(leafLabel.labelHash, domainsBase.leafLabelHash))
    // join latest registration for timestamp/expiry ordering
    .leftJoin(latestRegistration, eq(latestRegistration.domainId, domainsBase.id))
    .where(
      and(
        owner ? eq(domainsBase.ownerId, owner) : undefined,
        // TODO: determine if it's necessary to additionally escape user input for LIKE operator
        // Note: if label is NULL (unlabeled domain), LIKE returns NULL and filters out the row.
        // This is intentional - we can't match partial text against unknown labels.
        partial ? like(headLabel.value, `${partial}%`) : undefined,
      ),
    );

  return db.$with("domains").as(domains);
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
      .as("v1_path");
  }

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
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
    .as("v1_path");
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
      .as("v2_path");
  }

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
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
          -- Note: JOIN (not LEFT JOIN) is intentional - we only match domains
          -- with a complete canonical path to the searched FQDN
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
          -- Note: JOIN (not LEFT JOIN) is intentional - see base case comment
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
    .as("v2_path");
}

/**
 * Build ORDER BY clauses for a findDomains result.
 *
 * @param domains - The findDomains CTE result
 * @param orderBy - The field to order by (defaults to NAME)
 * @param orderDir - The direction to order ("ASC" or "DESC", defaults to "ASC")
 * @param inverted - Whether the relay pagination is inverted (backward pagination)
 * @returns Array of SQL order expressions
 */
export function orderFindDomains(
  domains: ReturnType<typeof findDomains>,
  orderBy: typeof DomainsOrderBy.$inferType | undefined | null,
  orderDir: typeof OrderDirection.$inferType | undefined | null,
  inverted: boolean,
): SQL[] {
  // Combine user's orderDir with relay's inverted (XOR logic)
  // inverted flips the sort for backward pagination, so we flip it back
  const effectiveDesc = (orderDir === "DESC") !== inverted;

  const orderColumn = {
    NAME: domains.leafLabelValue,
    REGISTRATION_TIMESTAMP: domains.registrationStart,
    REGISTRATION_EXPIRY: domains.registrationExpiry,
  }[orderBy ?? "NAME"];

  // Use NULLS LAST for ascending, NULLS FIRST for descending
  // This keeps unregistered domains at the end when sorting by registration fields
  const primaryOrder = effectiveDesc
    ? sql`${orderColumn} DESC NULLS FIRST`
    : sql`${orderColumn} ASC NULLS LAST`;

  // Always include id as tiebreaker for stable ordering
  const tiebreaker = effectiveDesc ? desc(domains.id) : asc(domains.id);

  return [primaryOrder, tiebreaker];
}
