import { trace } from "@opentelemetry/api";
import { Param, sql } from "drizzle-orm";
import type { Address, ChainId, DomainId, LabelHashPath, RegistryId } from "enssdk";

import type { RequiredAndNotNull } from "@ensnode/ensnode-sdk";

import di from "@/di";
import { withSpanAsync } from "@/lib/instrumentation/auto-span";
import { MAX_SUPPORTED_NAME_DEPTH } from "@/omnigraph-api/lib/constants";

const tracer = trace.getTracer("forward-walk-namegraph");

export interface WalkResultRow {
  domainId: DomainId;
  depth: number;
  address: Address | null;
  chainId: ChainId | null;
}

/**
 * Determines whether the WalkResultRow has a resolver set.
 */
export const hasResolver = (
  row: WalkResultRow,
): row is RequiredAndNotNull<WalkResultRow, "address" | "chainId"> =>
  row.address !== null && row.chainId !== null;

/**
 * Walks a disjoint namegraph from `registryId` through `path` to identify each ancestor Domain,
 * then LEFT JOINs each Domain to its Resolver via DRR and returns the full path ordered by depth
 * DESC (deepest first). Resolver-less Domains are kept in the result with `resolver`/`chainId` set
 * to NULL. Recursion terminates when the path is exhausted.
 */
export async function forwardWalkDisjointNamegraph(registryId: RegistryId, path: LabelHashPath) {
  if (path.length === 0) return [];

  // NOTE: using new Param as per https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(path)}::text[]`;

  const { ensDb, ensIndexerSchema } = di.context;

  const result = await withSpanAsync(tracer, "forward-walk", { registryId, path }, () =>
    ensDb.execute(sql`
    WITH RECURSIVE path AS (
      SELECT
        ${registryId}::text         AS next_registry_id,
        NULL::text                  AS "domainId",
        0                           AS depth

      UNION ALL

      SELECT
        -- NOTE: this walk specifically addresses non-canonical Domains as well, so it follows the
        -- raw on-chain forward pointer domain.subregistry_id directly, without canonical edge authentication
        d.subregistry_id            AS next_registry_id,
        d.id                        AS "domainId",
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
      drr.resolver  AS "address",
      drr.chain_id  AS "chainId",
      path.depth
    FROM path
    LEFT JOIN ${ensIndexerSchema.domainResolverRelation} drr
      ON drr.domain_id = path."domainId"
    WHERE path."domainId" IS NOT NULL
    ORDER BY path.depth DESC;
  `),
  );

  return result.rows as unknown as WalkResultRow[];
}
