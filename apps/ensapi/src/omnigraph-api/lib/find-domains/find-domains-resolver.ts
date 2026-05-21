import { trace } from "@opentelemetry/api";
import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, ilike, inArray, type SQL, sql } from "drizzle-orm";
import type { NormalizedAddress, RegistryId } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import { makeLogger } from "@/lib/logger";
import type { Context } from "@/omnigraph-api/context";
import { DomainCursors } from "@/omnigraph-api/lib/find-domains/domain-cursor";
import {
  cursorFilter,
  orderFindDomains,
  truncateNameForCursor,
} from "@/omnigraph-api/lib/find-domains/find-domains-resolver-helpers";
import type { DomainOrderValue } from "@/omnigraph-api/lib/find-domains/types";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { rejectAnyErrors } from "@/omnigraph-api/lib/reject-any-errors";
import {
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/omnigraph-api/schema/constants";
import { type Domain, DomainInterfaceRef } from "@/omnigraph-api/schema/domain";
import type {
  DomainsNameFilter,
  DomainsOrderInput,
  DomainsOrderValue,
} from "@/omnigraph-api/schema/domain-inputs";
import type { ENSProtocolVersion } from "@/omnigraph-api/schema/ens-protocol-version";

type DomainWithOrderValue = Domain & { __orderValue: DomainOrderValue };

const tracer = trace.getTracer("find-domains");
const logger = makeLogger("find-domains");

const DOMAINS_DEFAULT_ORDER = { by: "NAME", dir: "ASC" } satisfies DomainsOrderValue;

/**
 * Compound filter shape consumed by `resolveFindDomains`. Each property is optional; the resolver
 * applies a flat compound WHERE over the `domains` table, opting in to the registration joins
 * only when the corresponding order requires them.
 *
 * @dev all of these are nullable to streamline usage with the inferred input types used in these
 * resolvers. all null and undefined values are coerced to 'no filter'.
 */
export interface DomainsWhere {
  ownerId?: NormalizedAddress | null;
  registryId?: RegistryId | null;
  canonical?: boolean | null;
  name?: typeof DomainsNameFilter.$inferInput | null;
  version?: typeof ENSProtocolVersion.$inferType | null;
}

const VERSION_TO_DOMAIN_TYPE: Record<
  typeof ENSProtocolVersion.$inferType,
  (typeof ensIndexerSchema.domainType.enumValues)[number]
> = {
  ENSv1: "ENSv1Domain",
  ENSv2: "ENSv2Domain",
};

/**
 * Build the SQL condition for `where.name`.
 */
function nameCondition(filter: typeof DomainsNameFilter.$inferInput): SQL {
  if (filter.starts_with) {
    return ilike(ensIndexerSchema.domain.canonicalName, `${filter.starts_with}%`);
  }

  if (filter.eq) {
    return eq(ensIndexerSchema.domain.canonicalName, filter.eq);
  }

  if (filter.in) {
    // NOTE: avoid inArray([]) runtime error by short-circuit to an explicit empty result
    if (filter.in.length === 0) return sql`false`;
    return inArray(ensIndexerSchema.domain.canonicalName, filter.in);
  }

  throw new Error(
    "Invariant(nameCondition): empty filter provided, should not be possible with GraphQL @oneOf directive.",
  );
}

/**
 * Surface a default order when the name filter is a typeahead prefix — shorter names first so
 * `vitalik.eth` outranks `vitalik.ethereum.foundation` for input `"vitalik.et"`.
 */
function getDefaultOrder(where: DomainsWhere | undefined | null): DomainsOrderValue {
  if (where?.name?.starts_with) return { by: "DEPTH", dir: "ASC" };
  return DOMAINS_DEFAULT_ORDER;
}

/**
 * GraphQL API resolver for domain connection queries. Builds a single flat SELECT over
 * `domains` with conditional joins (parent registry / registration) driven by the supplied
 * `where` filters and ordering. Handles cursor-based pagination, ordering, and dataloader
 * loading. Used by `Query.domains`, `Account.domains`, `Registry.domains`, and `Domain.subdomains`.
 *
 * @param context - The GraphQL Context, required for Dataloader access
 * @param args - Compound `where` filter, optional ordering, and relay connection args
 */
export function resolveFindDomains(
  context: Context,
  {
    where,
    order,
    ...connectionArgs
  }: {
    where?: DomainsWhere | null;
    order?: typeof DomainsOrderInput.$inferInput | null;
    first?: number | null;
    last?: number | null;
    before?: string | null;
    after?: string | null;
  },
) {
  const defaultOrder = getDefaultOrder(where);
  const orderBy = order?.by ?? defaultOrder.by;
  const orderDir = order?.dir ?? defaultOrder.dir;

  const needsRegistrationJoin =
    orderBy === "REGISTRATION_TIMESTAMP" || orderBy === "REGISTRATION_EXPIRY";

  const filterConditions = and(
    // by ownerId
    where?.ownerId ? eq(ensIndexerSchema.domain.ownerId, where.ownerId) : undefined,
    // by registryId
    where?.registryId ? eq(ensIndexerSchema.domain.registryId, where.registryId) : undefined,
    // by canonical
    where?.canonical !== undefined && where?.canonical !== null
      ? eq(ensIndexerSchema.domain.canonical, where.canonical)
      : undefined,
    // by name
    where?.name ? nameCondition(where.name) : undefined,
    // by version
    where?.version
      ? eq(ensIndexerSchema.domain.type, VERSION_TO_DOMAIN_TYPE[where.version])
      : undefined,
  );

  return lazyConnection({
    totalCount: () =>
      withActiveSpanAsync(tracer, "find-domains.totalCount", {}, async () => {
        const rows = await ensDb
          .select({ count: count() })
          .from(ensIndexerSchema.domain)
          .where(filterConditions);
        return rows[0].count;
      }),

    connection: () =>
      resolveCursorConnection(
        {
          toCursor: (domain: DomainWithOrderValue) =>
            DomainCursors.encode({
              id: domain.id,
              by: orderBy,
              dir: orderDir,
              value: domain.__orderValue,
            }),
          defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
          maxSize: PAGINATION_DEFAULT_MAX_SIZE,
          args: connectionArgs,
        },
        async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
          const orderClauses = orderFindDomains(orderBy, orderDir, inverted);

          const beforeCursor = before ? DomainCursors.decode(before) : undefined;
          const afterCursor = after ? DomainCursors.decode(after) : undefined;

          // SELECT only `id` plus the active order column when it requires a JOIN. NAME/DEPTH
          // order values are read back from the dataloader-hydrated Domain — for those orderings
          // the keyset query stays narrow enough for an index-only scan against the composite
          // indexes on `domains`.
          const registrationValueColumn = (() => {
            switch (orderBy) {
              case "REGISTRATION_TIMESTAMP":
                return ensIndexerSchema.registration.start;
              case "REGISTRATION_EXPIRY":
                return ensIndexerSchema.registration.expiry;
              default:
                return sql<bigint | null>`NULL`.as("registration_value");
            }
          })();

          let query = ensDb
            .select({
              id: ensIndexerSchema.domain.id,
              registrationValue: registrationValueColumn,
            })
            .from(ensIndexerSchema.domain)
            .$dynamic();

          if (needsRegistrationJoin) {
            query = query
              .leftJoin(
                ensIndexerSchema.latestRegistrationIndex,
                eq(ensIndexerSchema.latestRegistrationIndex.domainId, ensIndexerSchema.domain.id),
              )
              .leftJoin(
                ensIndexerSchema.registration,
                and(
                  eq(ensIndexerSchema.registration.domainId, ensIndexerSchema.domain.id),
                  eq(
                    ensIndexerSchema.registration.registrationIndex,
                    ensIndexerSchema.latestRegistrationIndex.registrationIndex,
                  ),
                ),
              );
          }

          const finalQuery = query
            .where(
              and(
                filterConditions,
                beforeCursor ? cursorFilter(beforeCursor, orderBy, orderDir, "before") : undefined,
                afterCursor ? cursorFilter(afterCursor, orderBy, orderDir, "after") : undefined,
              ),
            )
            .orderBy(...orderClauses)
            .limit(limit);

          logger.debug({ sql: finalQuery.toSQL() });

          const results = await withActiveSpanAsync(
            tracer,
            "find-domains.connection",
            { orderBy, orderDir, limit },
            () => finalQuery.execute(),
          );

          const loadedDomains = await withActiveSpanAsync(
            tracer,
            "find-domains.dataloader",
            { count: results.length },
            () =>
              rejectAnyErrors(
                DomainInterfaceRef.getDataloader(context).loadMany(
                  results.map((result) => result.id),
                ),
              ),
          );

          const registrationValueById = needsRegistrationJoin
            ? new Map(results.map((r) => [r.id, r.registrationValue ?? null]))
            : null;

          return loadedDomains.map((domain): DomainWithOrderValue => {
            const __orderValue: DomainOrderValue = (() => {
              switch (orderBy) {
                case "NAME":
                  return truncateNameForCursor(domain.canonicalName);
                case "DEPTH":
                  return domain.canonicalDepth;
                case "REGISTRATION_TIMESTAMP":
                case "REGISTRATION_EXPIRY":
                  // `registrationValueById` is populated iff `needsRegistrationJoin` is true,
                  // which is exactly the REGISTRATION_* arms here. `loadedDomains` is keyed by
                  // the same ids as `results`, so the lookup is guaranteed to hit.
                  if (registrationValueById === null) {
                    throw new Error(
                      `Invariant: registrationValueById should be populated when orderBy=${orderBy}`,
                    );
                  }
                  return registrationValueById.get(domain.id) ?? null;
              }
            })();
            return { ...domain, __orderValue };
          });
        },
      ),
  });
}
