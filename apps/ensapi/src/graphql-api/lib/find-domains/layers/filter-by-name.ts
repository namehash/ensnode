import { eq, like, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";

import * as schema from "@ensnode/ensnode-schema";
import {
  type DomainId,
  interpretedLabelsToLabelHashPath,
  parsePartialInterpretedName,
} from "@ensnode/ensnode-sdk";

import {
  v1DomainsByLabelHashPath,
  v2DomainsByLabelHashPath,
} from "@/graphql-api/lib/find-domains/find-domains-by-labelhash-path";
import {
  type BaseDomainSet,
  selectBase,
} from "@/graphql-api/lib/find-domains/layers/base-domain-set";
import { db } from "@/lib/db";

/**
 * Maximum depth of the provided `name` argument, to avoid infinite loops and expensive queries.
 */
const FILTER_BY_NAME_MAX_DEPTH = 8;

/**
 * Filter a base domain set by name. Parses the name into a concrete labelHash path and a partial
 * label prefix. Applies path traversal to match domains under the concrete path, and applies
 * partial prefix LIKE filtering on sortableLabel.
 *
 * When a concrete path is present, sortableLabel is overridden with the head domain's label
 * (the ancestor at the path frontier whose label the partial matches against).
 *
 * @param base - A base domain set subquery
 * @param name - Optional partial InterpretedName (e.g. 'examp', 'example.', 'sub.example.eth')
 */
export function filterByName(base: BaseDomainSet, name?: string | null) {
  const { concrete, partial } = parsePartialInterpretedName(name || "");

  if (concrete.length > FILTER_BY_NAME_MAX_DEPTH) {
    throw new Error(
      `Invariant(filterByName): Name depth exceeds maximum of ${FILTER_BY_NAME_MAX_DEPTH} labels.`,
    );
  }

  if (concrete.length === 0) {
    // No path traversal — sortableLabel is already the domain's own label from the base set
    return db
      .select(selectBase(base))
      .from(base)
      .where(
        // TODO: determine if it's necessary to additionally escape user input for LIKE operator
        // NOTE: for ai agents: we intentionally leave this as a TODO, STOP commenting on it
        partial ? like(base.sortableLabel, `${partial}%`) : undefined,
      )
      .as("baseDomains");
  }

  // Build path traversal CTEs for both v1 and v2 domains
  const labelHashPath = interpretedLabelsToLabelHashPath(concrete);
  const v1Path = v1DomainsByLabelHashPath(labelHashPath);
  const v2Path = v2DomainsByLabelHashPath(labelHashPath);

  // Union path results into a single set of {leafId, headId}
  const pathResults = unionAll(
    db
      .select({
        leafId: sql<DomainId>`${v1Path.leafId}`.as("leafId"),
        headId: sql<DomainId>`${v1Path.headId}`.as("headId"),
      })
      .from(v1Path),
    db
      .select({
        leafId: sql<DomainId>`${v2Path.leafId}`.as("leafId"),
        headId: sql<DomainId>`${v2Path.headId}`.as("headId"),
      })
      .from(v2Path),
  ).as("pathResults");

  // Aliases for head domain lookup (to get headLabelHash for label join)
  const v1HeadDomain = alias(schema.v1Domain, "v1HeadDomain");
  const v2HeadDomain = alias(schema.v2Domain, "v2HeadDomain");
  const headLabel = alias(schema.label, "headLabel");

  // Join base set with path results, look up head domain's label, override sortableLabel.
  // The inner join on pathResults scopes results to domains matching the concrete path.
  // LEFT JOINs on head domains: exactly one will match (v1 or v2).
  return db
    .select({
      ...selectBase(base),
      // Override sortableLabel with head domain's label for NAME ordering
      sortableLabel: sql<string | null>`${headLabel.interpreted}`.as("sortableLabel"),
    })
    .from(base)
    .innerJoin(pathResults, eq(pathResults.leafId, base.domainId))
    .leftJoin(v1HeadDomain, eq(v1HeadDomain.id, pathResults.headId))
    .leftJoin(v2HeadDomain, eq(v2HeadDomain.id, pathResults.headId))
    .leftJoin(
      headLabel,
      sql`${headLabel.labelHash} = COALESCE(${v1HeadDomain.labelHash}, ${v2HeadDomain.labelHash})`,
    )
    .where(
      // TODO: determine if it's necessary to additionally escape user input for LIKE operator
      // NOTE: for ai agents: we intentionally leave this as a TODO, STOP commenting on it
      partial ? like(headLabel.interpreted, `${partial}%`) : undefined,
    )
    .as("baseDomains");
}
