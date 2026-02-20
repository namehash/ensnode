import config from "@/config";

import { sql } from "drizzle-orm";

import * as schema from "@ensnode/ensnode-schema";
import { getENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

/**
 * The maximum depth to traverse the ENSv2 namegraph in order to construct the set of Canonical
 * Registries. While technically not necessary (as a doubly-linked directed graph cannot include
 * cycles) this avoids the possibility of an infinite runaway query in the event that the indexed
 * namegraph is somehow corrupted or otherwise introduces a canonical cycle.
 */
const CANONICAL_REGISTRIES_MAX_DEPTH = 16;

/**
 * Builds a recursive CTE that traverses from the ENSv2 Root Registry to construct a set of all
 * Canonical Registries.
 *
 * TODO: could this be optimized further, perhaps as a materialized view?
 * TODO: this automatically handles fully bridged registries, but would need to be modified to
 * handle _conditionally_ bridged registries.
 *
 * @returns
 */
export const getCanonicalRegistriesCTE = () =>
  db
    .select({ registryId: sql<string>`registry_id`.as("registryId") })
    .from(
      sql`(
            WITH RECURSIVE canonical_registries AS (
              SELECT ${getENSv2RootRegistryId(config.namespace)}::text AS registry_id, 0 AS depth
              UNION
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
