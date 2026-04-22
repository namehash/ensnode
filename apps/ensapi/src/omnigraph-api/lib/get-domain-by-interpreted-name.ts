import config from "@/config";

import { trace } from "@opentelemetry/api";
import { Param, sql } from "drizzle-orm";
import {
  type DomainId,
  type InterpretedName,
  interpretedLabelsToLabelHashPath,
  interpretedNameToInterpretedLabels,
  type RegistryId,
} from "enssdk";

import { getENSv1RootRegistryId, maybeGetENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import { lazy } from "@/lib/lazy";
import { makeLogger } from "@/lib/logger";

// lazy() defers construction until first use so that this module can be imported without env vars
// being present (e.g. during OpenAPI generation).
const getV1Root = lazy(() => getENSv1RootRegistryId(config.namespace));
const getV2Root = lazy(() => maybeGetENSv2RootRegistryId(config.namespace));

const tracer = trace.getTracer("get-domain-by-interpreted-name");
const logger = makeLogger("get-domain-by-interpreted-name");

/**
 * Domain lookup by Interpreted Name via forward traversal of the namegraph.
 *
 * This mirrors ENS Forward Resolution (walking from the root registry through each label in the name)
 * with the exception that, in ENSv2, expired names are still retrievable: this traversal does _not_
 * check registration expiry, so callers can query Domains even after they are expired.
 *
 * For context, in ENSv1, expired names are still resolvable.
 * In ENSv2, the default PermissionedRegistry (and UserRegistry) implement the logic 'if name is
 * expired, it doesn't exist', which means expired names would not be resolvable via Forward Resolution.
 * This choice, however, is made at the Registry level, not within Forward Resolution, so other
 * Registry implementations could choose to do things differently.
 *
 * @see https://github.com/ensdomains/contracts-v2/blob/8a5bb130bc25adf68541d55e4a9a9bf453fb37fc/contracts/src/registry/PermissionedRegistry.sol#L217-L220
 * @see https://github.com/ensdomains/contracts-v2/blob/8a5bb130bc25adf68541d55e4a9a9bf453fb37fc/contracts/src/registry/PermissionedRegistry.sol#L223-L226
 *
 * Regardless, this function does not consider a Domain's registration status for retrieval because
 * this traversal is designed to support access to a Domain via API—not Protocol Acceleration—and
 * consumers need to reference Domains regardless of whether they're active or expired.
 *
 * This means that a Domain identified by this function may not be accessible by ENS Forward Resolution:
 * an expired Domain in a PermissionedRegistry/UserRegistry does not exist in the context of
 * Forward Resolution.
 *
 * Note that if a Domain has been migrated from ENSv1 to ENSv2, the ENSv2 Domain entity is returned,
 * mirroring ENS Forward Resolution.
 *
 * Finally, this also means that Domains are addressable by any number of (possibly infinite) Aliases.
 * i.e. if a name 'alias.eth' declares that the registry containing 'sub' is its subregistry but
 * that subregistry declares a different Canonical Domain, we are still able to access the 'sub' Domain
 * via 'sub.alias.eth'. Naturally, 'sub's Canonical Name will continue to be 'sub.canonical.eth',
 * not the alias by which it was queried ('sub.alias.eth').
 */
export async function getDomainIdByInterpretedName(
  name: InterpretedName,
): Promise<DomainId | null> {
  return withActiveSpanAsync(tracer, "getDomainIdByInterpretedName", { name }, async () => {
    const v1Root = getV1Root();
    const v2Root = getV2Root();

    const [v1DomainId, v2DomainId] = await Promise.all([
      withActiveSpanAsync(tracer, "v1_getDomainId", {}, () => traverseFromRoot(v1Root, name)),
      // only resolve v2 Domain if ENSv2 Root Registry is defined
      v2Root
        ? withActiveSpanAsync(tracer, "v2_getDomainId", {}, () => traverseFromRoot(v2Root, name))
        : null,
    ]);

    logger.debug({ v1DomainId, v2DomainId });

    // prefer v2 Domain over v1 Domain
    return v2DomainId || v1DomainId || null;
  });
}

/**
 * Forward-traverses the namegraph from `rootRegistryId`, one label at a time, using the unified
 * `domain.subregistryId` pointer to hop from a parent Domain to the Registry its subnames live in.
 *
 * Both ENSv1 and ENSv2 Domains set `subregistryId` — ENSv1 Domains to their managed ENSv1
 * VirtualRegistry (set on first-child indexing), ENSv2 Domains to their declared Subregistry — so
 * a single recursive CTE handles both lineages. The starting root picks which lineage: v1 and v2
 * registry IDs are disjoint, so there is no cross-contamination.
 */
async function traverseFromRoot(
  rootRegistryId: RegistryId,
  name: InterpretedName,
): Promise<DomainId | null> {
  const labelHashPath = interpretedLabelsToLabelHashPath(interpretedNameToInterpretedLabels(name));

  // https://github.com/drizzle-team/drizzle-orm/issues/1289#issuecomment-2688581070
  const rawLabelHashPathArray = sql`${new Param(labelHashPath)}::text[]`;

  // TODO: need to join latest registration and confirm that it's not expired, if expired should treat the domain as not existing

  const result = await ensDb.execute(sql`
    WITH RECURSIVE path AS (
      SELECT
        ${rootRegistryId}::text AS next_registry_id,
        NULL::text AS domain_id,
        0 AS depth

      UNION ALL

      SELECT
        d.subregistry_id AS next_registry_id,
        d.id AS domain_id,
        path.depth + 1
      FROM path
      JOIN ${ensIndexerSchema.domain} d
        ON d.registry_id = path.next_registry_id
      WHERE d.label_hash = (${rawLabelHashPathArray})[path.depth + 1]
        AND path.depth + 1 <= array_length(${rawLabelHashPathArray}, 1)
    )
    SELECT *
    FROM path
    WHERE domain_id IS NOT NULL
    ORDER BY depth;
  `);

  const rows = result.rows as { domain_id: DomainId; depth: number }[];

  if (rows.length === 0) return null;

  // biome-ignore lint/style/noNonNullAssertion: length check above
  const leaf = rows[rows.length - 1]!;
  const exact = rows.length === labelHashPath.length;

  return exact ? leaf.domain_id : null;
}
