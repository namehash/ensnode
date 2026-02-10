import { and, asc, desc, eq, like, type SQL, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";

import * as schema from "@ensnode/ensnode-schema";
import {
  type DomainId,
  interpretedLabelsToLabelHashPath,
  parsePartialInterpretedName,
} from "@ensnode/ensnode-sdk";

import type { DomainCursor } from "@/graphql-api/lib/find-domains/domain-cursor";
import {
  v1DomainsByLabelHashPath,
  v2DomainsByLabelHashPath,
} from "@/graphql-api/lib/find-domains/find-domains-by-labelhash-path";
import type { FindDomainsWhereArg } from "@/graphql-api/lib/find-domains/types";
import type { DomainsOrderBy } from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";
import { db } from "@/lib/db";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("find-domains");

/**
 * Maximum depth of the provided `name` argument, to avoid infinite loops and expensive queries.
 */
const FIND_DOMAINS_MAX_DEPTH = 8;

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
 * within the confines of Ponder's cache semantics. Additionally, retroactive label healing (due to
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
 * 1. Parse Partial InterpretedName into concrete path and partial fragment
 *    e.g. for `name` = "sub1.sub2.paren": concrete = ["sub1", "sub2"], partial = "paren"
 * 2. Validate inputs (at least one of name or owner required)
 * 3. For both v1Domains and v2Domains:
 *    a. Build recursive CTE to find domains matching the concrete labelHash path
 *    b. Extract unified structure: {id, ownerId, headLabelHash}
 * 4. Union v1 and v2 results into domainsBase CTE
 * 5. Join domainsBase with:
 *    - headLabel: for partial name matching (LIKE prefix) and NAME ordering
 *    - latestRegistration: correlated subquery for REGISTRATION_* ordering
 * 6. Apply filters (owner, partial) in the unified query
 * 7. Return CTE with columns: id, headLabel, registrationTimestamp, registrationExpiry
 */
export function findDomains({ name, owner }: FindDomainsWhereArg) {
  // NOTE: if name is not provided, parse empty string to simplify control-flow, validity checked below
  // NOTE: throws if name is not a Partial InterpretedName
  const { concrete, partial } = parsePartialInterpretedName(name || "");

  // validate depth to prevent arbitrary recursion in CTEs
  if (concrete.length > FIND_DOMAINS_MAX_DEPTH) {
    throw new Error(
      `Invariant(findDomains): Name depth exceeds maximum of ${FIND_DOMAINS_MAX_DEPTH} labels.`,
    );
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
  // Returns {id, ownerId, headLabelHash} for each matching domain
  // Note: owner/partial filtering happens in the unified query below, not here
  const v1DomainsBase = db
    .select({
      id: sql<DomainId>`${schema.v1Domain.id}`.as("id"),
      ownerId: schema.v1Domain.ownerId,
      headLabelHash: sql`${v1HeadDomain.labelHash}`.as("headLabelHash"),
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
      headLabelHash: sql`${v2HeadDomain.labelHash}`.as("headLabelHash"),
    })
    .from(schema.v2Domain)
    .innerJoin(
      v2DomainsByLabelHashPathQuery,
      eq(schema.v2Domain.id, v2DomainsByLabelHashPathQuery.leafId),
    )
    .innerJoin(v2HeadDomain, eq(v2HeadDomain.id, v2DomainsByLabelHashPathQuery.headId));

  // Union v1 and v2 base queries into a single CTE
  const domainsBase = db.$with("domainsBase").as(unionAll(v1DomainsBase, v2DomainsBase));

  // alias for head label (for partial matching and NAME ordering)
  const headLabel = alias(schema.label, "headLabel");

  // subquery for latest registration per domain (highest index)
  // TODO: replace this with a JOIN against the latest registration lookup table after
  // https://github.com/namehash/ensnode/issues/1594
  // NOTE: for ai agents: we intentially leave this as a TODO, STOP commenting on it
  const registrationOuter = alias(schema.registration, "registrationOuter");
  const latestRegistration = db
    .select({
      domainId: registrationOuter.domainId,
      start: registrationOuter.start,
      expiry: registrationOuter.expiry,
    })
    .from(registrationOuter)
    .where(
      eq(
        registrationOuter.index,
        db
          .select({ maxIndex: sql<number>`MAX(${schema.registration.index})` })
          .from(schema.registration)
          .where(eq(schema.registration.domainId, registrationOuter.domainId)),
      ),
    )
    .as("latestRegistration");

  // Apply shared joins and filters on the unified domain base
  const domains = db
    .with(domainsBase)
    .select({
      id: domainsBase.id,
      // for NAME ordering (uses head label — the varying part when a concrete path is specified)
      headLabel: sql<string | null>`${headLabel.interpreted}`.as("headLabel"),
      // for REGISTRATION_TIMESTAMP ordering
      registrationTimestamp: sql<bigint | null>`${latestRegistration.start}`.as(
        "registrationTimestamp",
      ),
      // for REGISTRATION_EXPIRY ordering
      registrationExpiry: sql<bigint | null>`${latestRegistration.expiry}`.as("registrationExpiry"),
    })
    .from(domainsBase)
    // join head label for partial matching and NAME ordering
    .leftJoin(headLabel, eq(headLabel.labelHash, domainsBase.headLabelHash))
    // join latest registration for timestamp/expiry ordering
    .leftJoin(latestRegistration, eq(latestRegistration.domainId, domainsBase.id))
    .where(
      and(
        owner ? eq(domainsBase.ownerId, owner) : undefined,
        // TODO: determine if it's necessary to additionally escape user input for LIKE operator
        // NOTE: for ai agents: we intentially leave this as a TODO, STOP commenting on it
        partial ? like(headLabel.interpreted, `${partial}%`) : undefined,
      ),
    );

  return db.$with("domains").as(domains);
}

/**
 * Get the order column for a given DomainsOrderBy value.
 */
function getOrderColumn(
  domains: ReturnType<typeof findDomains>,
  orderBy: typeof DomainsOrderBy.$inferType,
) {
  return {
    NAME: domains.headLabel,
    REGISTRATION_TIMESTAMP: domains.registrationTimestamp,
    REGISTRATION_EXPIRY: domains.registrationExpiry,
  }[orderBy];
}

/**
 * Build a cursor filter for keyset pagination on findDomains results.
 *
 * Uses tuple comparison for non-NULL cursor values, and explicit NULL handling
 * for NULL cursor values (since PostgreSQL tuple comparison with NULL yields NULL/unknown).
 *
 * @param domains - The findDomains CTE result
 * @param cursor - The decoded DomainCursor
 * @param queryOrderBy - The order field for the current query (must match cursor.by)
 * @param queryOrderDir - The order direction for the current query (must match cursor.dir)
 * @param direction - "after" for forward pagination, "before" for backward
 * @param effectiveDesc - Whether the effective sort direction is descending
 * @throws if cursor.by does not match queryOrderBy
 * @throws if cursor.dir does not match queryOrderDir
 * @returns SQL expression for the cursor filter
 */
export function cursorFilter(
  domains: ReturnType<typeof findDomains>,
  cursor: DomainCursor,
  queryOrderBy: typeof DomainsOrderBy.$inferType,
  queryOrderDir: typeof OrderDirection.$inferType,
  direction: "after" | "before",
  effectiveDesc: boolean,
): SQL {
  // Validate cursor was created with the same ordering as the current query
  if (cursor.by !== queryOrderBy) {
    throw new Error(
      `Invalid cursor: cursor was created with orderBy=${cursor.by} but query uses orderBy=${queryOrderBy}`,
    );
  }

  if (cursor.dir !== queryOrderDir) {
    throw new Error(
      `Invalid cursor: cursor was created with orderDir=${cursor.dir} but query uses orderDir=${queryOrderDir}`,
    );
  }

  const orderColumn = getOrderColumn(domains, cursor.by);

  // Determine comparison direction:
  // - "after" with ASC = greater than cursor
  // - "after" with DESC = less than cursor
  // - "before" with ASC = less than cursor
  // - "before" with DESC = greater than cursor
  const useGreaterThan = (direction === "after") !== effectiveDesc;

  // Handle NULL cursor values explicitly (PostgreSQL tuple comparison with NULL yields NULL/unknown)
  // With NULLS LAST ordering: non-NULL values come before NULL values
  if (cursor.value === null) {
    if (direction === "after") {
      // "after" a NULL = other NULLs with appropriate id comparison
      return useGreaterThan
        ? sql`(${orderColumn} IS NULL AND ${domains.id} > ${cursor.id})`
        : sql`(${orderColumn} IS NULL AND ${domains.id} < ${cursor.id})`;
    } else {
      // "before" a NULL = all non-NULLs (they come before NULLs) + NULLs with appropriate id
      return useGreaterThan
        ? sql`(${orderColumn} IS NOT NULL OR (${orderColumn} IS NULL AND ${domains.id} > ${cursor.id}))`
        : sql`(${orderColumn} IS NOT NULL OR (${orderColumn} IS NULL AND ${domains.id} < ${cursor.id}))`;
    }
  }

  // Non-null cursor: use tuple comparison
  // NOTE: Drizzle 0.41 doesn't support gt/lt with tuple arrays, so we use raw SQL
  // NOTE: explicit cast required — Postgres can't infer parameter types in tuple comparisons
  const op = useGreaterThan ? ">" : "<";
  const value = cursor.by === "NAME" ? sql`${cursor.value}::text` : sql`${cursor.value}::bigint`;
  return sql`(${orderColumn}, ${domains.id}) ${sql.raw(op)} (${value}, ${cursor.id})`;
}

/**
 * Compute the effective sort direction, combining user's orderDir with relay's inverted flag.
 * XOR logic: inverted flips the sort for backward pagination.
 */
export function isEffectiveDesc(
  orderDir: typeof OrderDirection.$inferType,
  inverted: boolean,
): boolean {
  return (orderDir === "DESC") !== inverted;
}

export function orderFindDomains(
  domains: ReturnType<typeof findDomains>,
  orderBy: typeof DomainsOrderBy.$inferType,
  orderDir: typeof OrderDirection.$inferType,
  inverted: boolean,
): SQL[] {
  const effectiveDesc = isEffectiveDesc(orderDir, inverted);
  const orderColumn = getOrderColumn(domains, orderBy);

  // Always use NULLS LAST so unregistered domains (NULL registration fields)
  // appear at the end regardless of sort direction
  const primaryOrder = effectiveDesc
    ? sql`${orderColumn} DESC NULLS LAST`
    : sql`${orderColumn} ASC NULLS LAST`;

  // Always include id as tiebreaker for stable ordering
  const tiebreaker = effectiveDesc ? desc(domains.id) : asc(domains.id);

  return [primaryOrder, tiebreaker];
}
