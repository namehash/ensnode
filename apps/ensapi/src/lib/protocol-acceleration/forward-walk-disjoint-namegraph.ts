import { trace } from "@opentelemetry/api";
import { Param, sql } from "drizzle-orm";
import type { Address, ChainId, DomainId, LabelHashPath, RegistryId } from "enssdk";

import type { RequiredAndNotNull } from "@ensnode/ensnode-sdk";

import di from "@/di";
import { withSpanAsync } from "@/lib/instrumentation/auto-span";
import { MAX_SUPPORTED_NAME_DEPTH } from "@/omnigraph-api/lib/constants";

const tracer = trace.getTracer("forward-walk-disjoint-namegraph");

// TODO(fold-protocol-acceleration): this walk reads the Unigraph-maintained `domain` table (the
// Registry hierarchy), not Protocol Acceleration tables. Once the plugins are folded it can move to
// omnigraph-api/lib/ alongside its other consumer (get-domain-by-interpreted-name.ts).
export interface WalkResultRow {
  domainId: DomainId;
  depth: number;

  /**
   * The Registry this Domain lives in (i.e. its parent's Subregistry).
   * */
  registryId: RegistryId;

  /**
   * This Domain's assigned Resolver address (via DRR), or NULL if it has no Resolver.
   */
  address: Address | null;

  /**
   * This Domain's assigned Resolver's chainId (via DRR), or NULL if it has no Resolver.
   */
  chainId: ChainId | null;

  /**
   * Whether this Domain's assigned Resolver is an ENSIP-10 wildcard (`IExtendedResolver`). NULL when
   * the Domain has no Resolver (mirrors `address`/`chainId`); a Resolver row always carries it.
   */
  extended: boolean | null;

  /**
   * This Domain's materialized Canonical Path (root→leaf inclusive), or NULL when it is not in the
   * Canonical Nametree. Used to build the canonical path of a resolvable-but-unindexed descendant.
   */
  canonicalPath: DomainId[] | null;
}

/**
 * Determines whether the WalkResultRow has a resolver set. When it does, `address`, `chainId`, and
 * `extended` are all non-null together (every indexed Resolver referenced by a Domain-Resolver
 * Relation has a Resolver row carrying `extended`).
 */
export const walkResultRowHasResolver = (
  row: WalkResultRow,
): row is RequiredAndNotNull<WalkResultRow, "address" | "chainId" | "extended"> =>
  row.address !== null && row.chainId !== null && row.extended !== null;

/**
 * Walks a disjoint namegraph from `registryId` through `path` to identify each ancestor Domain,
 * then LEFT JOINs each Domain to its Resolver (via DRR, joined onward to the Resolver entity for
 * its `extended` flag) and returns the full path ordered by depth DESC (deepest first).
 * Resolver-less Domains are kept in the result with `address`/`chainId` NULL and `extended` false.
 * Recursion terminates when the path is exhausted.
 */
export async function forwardWalkDisjointNamegraph(registryId: RegistryId, path: LabelHashPath) {
  if (path.length === 0) return [];

  // Invariant: reject over-depth paths rather than silently truncating at MAX_SUPPORTED_NAME_DEPTH
  // (the recursive CTE stops there), which would resolve against a truncated ancestor path.
  if (path.length > MAX_SUPPORTED_NAME_DEPTH) {
    throw new Error(
      `Invariant(forwardWalkDisjointNamegraph): path length ${path.length} exceeds maximum depth ${MAX_SUPPORTED_NAME_DEPTH}.`,
    );
  }

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(path)}::text[]`;

  const { ensDb, ensIndexerSchema } = di.context;

  const result = await withSpanAsync(tracer, "forward-walk", { registryId, path }, () =>
    ensDb.execute(sql`
    WITH RECURSIVE path AS (
      SELECT
        ${registryId}::text         AS next_registry_id,
        NULL::text                  AS registry_id,
        NULL::text                  AS "domainId",
        NULL::text[]                AS canonical_path,
        0                           AS depth

      UNION ALL

      SELECT
        -- NOTE: this walk specifically addresses non-canonical Domains as well, so it follows the
        -- raw on-chain forward pointer domain.subregistry_id directly, without canonical edge authentication
        d.subregistry_id            AS next_registry_id,
        -- the Registry this Domain lives in is the Registry we walked into to find it
        path.next_registry_id       AS registry_id,
        d.id                        AS "domainId",
        d.canonical_path            AS canonical_path,
        path.depth + 1
      FROM path
      JOIN ${ensIndexerSchema.domain} d
        ON d.registry_id = path.next_registry_id
      WHERE d.label_hash = (${rawLabelHashPathArray})[path.depth + 1]
        AND path.depth + 1 <= array_length(${rawLabelHashPathArray}, 1)
        AND path.depth < ${MAX_SUPPORTED_NAME_DEPTH}
    )
    SELECT
      path."domainId",
      path.registry_id        AS "registryId",
      drr.resolver            AS "address",
      drr.chain_id            AS "chainId",
      r.extended              AS "extended",
      path.canonical_path     AS "canonicalPath",
      path.depth
    FROM path
    LEFT JOIN ${ensIndexerSchema.domainResolverRelation} drr
      ON drr.domain_id = path."domainId"
    LEFT JOIN ${ensIndexerSchema.resolver} r
      ON r.chain_id = drr.chain_id AND r.address = drr.resolver
    WHERE path."domainId" IS NOT NULL
    ORDER BY path.depth DESC;
  `),
  );

  return result.rows as unknown as WalkResultRow[];
}
