import { inArray, sql } from "drizzle-orm";
import type { InterpretedName } from "enssdk";

import { ensDb } from "@/lib/ensdb/singleton";

import { type BaseDomainSet, selectBase } from "./base-domain-set";

/**
 * Filter a base domain set to Domains whose materialized `canonicalName` exactly matches one of
 * `names`. Validation (max-length, etc.) is enforced at the GraphQL input layer.
 *
 * Non-canonical rows have `canonicalName = NULL`, so they cannot match by construction — no
 * separate root-anchoring guard is required.
 *
 * @param base - A base domain set subquery
 * @param names - Exact InterpretedNames to match against
 */
export function filterByNameIn(base: BaseDomainSet, names: InterpretedName[]) {
  // Drizzle footgun: `inArray(col, [])` generates `col in ()`, a Postgres syntax error.
  // Short-circuit to an explicit empty result.
  if (names.length === 0) {
    return ensDb.select(selectBase(base)).from(base).where(sql`false`).as("baseDomains");
  }

  return ensDb
    .select(selectBase(base))
    .from(base)
    .where(inArray(base.canonicalName, names))
    .as("baseDomains");
}
