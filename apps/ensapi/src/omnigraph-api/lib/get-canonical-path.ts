import { sql } from "drizzle-orm";
import type { CanonicalPath, DomainId, RegistryId } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { MAX_SUPPORTED_NAME_DEPTH } from "@/omnigraph-api/lib/constants";

/**
 * Provide the canonical parents for a Domain via reverse traversal of the namegraph.
 *
 * Walks `domain → registry → registry.canonicalDomainId` upward via the materialized canonical
 * edge until the registry has no canonical parent (root). Returns `null` when the input Domain is
 * not itself canonical (`domain.canonical = false`).
 */
export async function getCanonicalPath(domainId: DomainId): Promise<CanonicalPath | null> {
  // Short-circuit for non-canonical Domains
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

      -- Step upward: domain → current registry's canonical parent domain via the bidirectional
      -- canonical-edge agreement (registries.canonical_domain_id = domains.id AND
      -- domains.subregistry_id = registries.id), computed on demand at each hop.
      -- We allow recursion to one row beyond MAX_DEPTH so we can detect (and throw on) a
      -- legitimate path that exceeds the cap, rather than silently truncating it.
      SELECT
        pd.id AS domain_id,
        pd.registry_id,
        upward.depth + 1
      FROM upward
      JOIN ${ensIndexerSchema.registry} ur
        ON ur.id = upward.registry_id
      JOIN ${ensIndexerSchema.domain} pd
        ON pd.id = ur.canonical_domain_id
       AND pd.subregistry_id = ur.id
      WHERE upward.depth <= ${MAX_SUPPORTED_NAME_DEPTH}
    )
    SELECT *
    FROM upward
    ORDER BY depth;
  `);

  const rows = result.rows as { domain_id: DomainId; registry_id: RegistryId }[];

  // not necessary due to above Domain.canonical check but safety first
  if (rows.length === 0) {
    throw new Error(
      `Invariant(getCanonicalPath): DomainId '${domainId}' is canonical but produced no upward path.`,
    );
  }

  // depth check
  if (rows.length > MAX_SUPPORTED_NAME_DEPTH) {
    throw new Error(
      `Invariant(getCanonicalPath): DomainId '${domainId}' produced a canonical path deeper than ${MAX_SUPPORTED_NAME_DEPTH}.`,
    );
  }

  return rows.map((row) => row.domain_id);
}
