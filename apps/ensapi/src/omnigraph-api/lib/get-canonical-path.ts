import { sql } from "drizzle-orm";
import type { CanonicalPath, DomainId, RegistryId } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";

/**
 * Maximum depth to walk before throwing. ENS names have no formal depth limit, but at the
 * Omnigraph API boundary we cap traversal to fail loudly rather than risk an unbounded
 * recursive CTE if the canonical-tree invariant is ever violated. The cap is detected via an
 * extra row beyond `MAX_DEPTH`; if that row is produced we throw rather than silently truncate.
 */
const MAX_DEPTH = 16;

/**
 * Provide the canonical parents for a Domain via reverse traversal of the namegraph.
 *
 * Walks `domain → registry → registry.canonicalDomainId` upward via the materialized canonical
 * edge until the registry has no canonical parent (root). Returns `null` when the input Domain is
 * not itself canonical (`domain.canonical = false`).
 */
export async function getCanonicalPath(domainId: DomainId): Promise<CanonicalPath | null> {
  // Short-circuit non-canonical Domains via the materialized flag.
  const domain = await ensDb.query.domain.findFirst({
    where: (t, { eq }) => eq(t.id, domainId),
    columns: { canonical: true },
  });
  if (!domain) {
    throw new Error(`Invariant(getCanonicalPath): DomainId '${domainId}' did not exist.`);
  }
  if (!domain.canonical) return null;

  const result = await ensDb.execute(sql`
    WITH RECURSIVE upward AS (
      -- Base case: start from the target domain
      SELECT
        d.id AS domain_id,
        d.registry_id,
        1 AS depth
      FROM ${ensIndexerSchema.domain} d
      WHERE d.id = ${domainId}

      UNION ALL

      -- Step upward: domain → current registry's canonical parent domain.
      -- The bidirectional invariant guarantees consistency, so no edge-auth is needed.
      -- We allow recursion to one row beyond MAX_DEPTH so we can detect (and throw on) a
      -- legitimate path that exceeds the cap, rather than silently truncating it.
      SELECT
        pd.id AS domain_id,
        pd.registry_id,
        upward.depth + 1
      FROM upward
      JOIN ${ensIndexerSchema.registry} r
        ON r.id = upward.registry_id
      JOIN ${ensIndexerSchema.domain} pd
        ON pd.id = r.canonical_domain_id
      WHERE upward.depth <= ${MAX_DEPTH}
    )
    SELECT *
    FROM upward
    ORDER BY depth;
  `);

  const rows = result.rows as { domain_id: DomainId; registry_id: RegistryId }[];

  // Defense-in-depth: the existence + canonical check above guarantees the CTE base case yields
  // at least one row, so this branch is unreachable under correct invariant maintenance.
  if (rows.length === 0) {
    throw new Error(
      `Invariant(getCanonicalPath): DomainId '${domainId}' is canonical but produced no upward path.`,
    );
  }

  if (rows.length > MAX_DEPTH) {
    throw new Error(
      `Invariant(getCanonicalPath): DomainId '${domainId}' produced a canonical path deeper than ${MAX_DEPTH}.`,
    );
  }

  return rows.map((row) => row.domain_id);
}
