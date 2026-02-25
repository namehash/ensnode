import config from "@/config";

import { sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import { getENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

/**
 * The maximum depth to traverse the ENSv2 namegraph in order to construct the set of Canonical
 * Registries.
 *
 * Note that the set of Canonical Registries in the ENSv2 Namegraph is a _tree_, enforced by the
 * requirement that each Registry maintain a reverse-pointer to its Canonical Domain, a form of
 * 'edge authentication': if the reverse-pointer doesn't agree with the forward-pointer, the edge
 * is not traversed, making cycles within the direced graph impossible.
 *
 * So while technically not necessary, including the depth constraint avoids the possibility of an
 * infinite runaway query in the event that the indexed namegraph is somehow corrupted or otherwise
 * introduces a canonical cycle.
 */
const CANONICAL_REGISTRIES_MAX_DEPTH = 16;

/**
 * Builds a recursive CTE that traverses from the ENSv2 Root Registry to construct a set of all
 * Canonical Registries. A Canonical Registry is an ENSv2 Registry that is the Root Registry or the
 * (sub)Registry of a Domain in a Canonical Registry.
 *
 * TODO: could this be optimized further, perhaps as a materialized view?
 */
export const getCanonicalRegistriesCTE = () =>
  db
    .select({
      // NOTE: using `id` here to avoid clobbering `registryId` in consuming queries, which would
      // result in '_ is ambiguous' error messages from postgres because drizzle isn't scoping the
      // selection properly. a bit fragile but works for now.
      id: sql<string>`registry_id`.as("id"),
    })
    .from(
      sql`(
            WITH RECURSIVE canonical_registries AS (
              SELECT ${getENSv2RootRegistryId(config.namespace)}::text AS registry_id, 0 AS depth
              UNION ALL
              SELECT rcd.registry_id, cr.depth + 1
              FROM ${schema.registryCanonicalDomain} rcd
              JOIN ${schema.v2Domain} parent ON parent.id = rcd.domain_id AND parent.subregistry_id = rcd.registry_id
              JOIN canonical_registries cr ON cr.registry_id = parent.registry_id
              WHERE cr.depth < ${CANONICAL_REGISTRIES_MAX_DEPTH}
            )
            SELECT registry_id FROM canonical_registries
          ) AS canonical_registries_cte`,
    )
    .as("canonical_registries");
