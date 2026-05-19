import { trace } from "@opentelemetry/api";
import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, ilike, inArray, type SQL, sql } from "drizzle-orm";
import type { InterpretedName, NormalizedAddress, RegistryId } from "enssdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import { makeLogger } from "@/lib/logger";
import type { context as createContext } from "@/omnigraph-api/context";
import { DomainCursors } from "@/omnigraph-api/lib/find-domains/domain-cursor";
import {
  cursorFilter,
  orderFindDomains,
} from "@/omnigraph-api/lib/find-domains/find-domains-resolver-helpers";
import type { DomainOrderValue } from "@/omnigraph-api/lib/find-domains/types";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { rejectAnyErrors } from "@/omnigraph-api/lib/reject-any-errors";
import {
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/omnigraph-api/schema/constants";
import { type Domain, DomainInterfaceRef } from "@/omnigraph-api/schema/domain";
import {
  DOMAINS_DEFAULT_ORDER_BY,
  DOMAINS_DEFAULT_ORDER_DIR,
  type DomainsOrderBy,
  type DomainsOrderInput,
} from "@/omnigraph-api/schema/domain-inputs";
import type { ENSProtocolVersion } from "@/omnigraph-api/schema/ens-protocol-version";

/**
 * Domain with order value injected.
 *
 * @dev Relevant to composite DomainCursor encoding, see `domain-cursor.ts`
 */
type DomainWithOrderValue = Domain & { __orderValue: DomainOrderValue };

const tracer = trace.getTracer("find-domains");
const logger = makeLogger("find-domains-resolver");

/**
 * @oneOf filter shape over Domain name. Mirrors the GraphQL `DomainsNameFilter` input.
 */
export interface DomainsNameFilterValue {
  starts_with?: string | null;
  eq?: InterpretedName | null;
  in?: InterpretedName[] | null;
}

/**
 * Compound filter shape consumed by `resolveFindDomains`. Each property is optional; the resolver
 * applies a flat compound WHERE over the `domains` table, opting in to the registration joins
 * only when the corresponding order requires them.
 *
 * Note on `registryId`:
 *  - `undefined` — no registry filter
 *  - explicit `null` — match nothing. Callers use this when the upstream value is itself null
 *    (e.g. a parent Domain with no declared subregistry, hence no forward-walk subdomains).
 *  - a `RegistryId` — equality filter
 *
 * `Domain.subdomains` is the only caller that may pass `null`; it forward-walks the parent
 * Domain's `subregistryId` directly, avoiding a JOIN to `registries` and the planner stats blind
 * spot that the reverse-walk variant (`registry.canonical_domain_id = parent.id`) suffered from.
 */
export interface DomainsWhere {
  ownerId?: NormalizedAddress | null;
  registryId?: RegistryId | null;
  /**
   * If `true`, filter to canonical Domains only. Any other value (including `false`, `null`,
   * `undefined`) leaves canonicality un-filtered. This preserves the existing
   * `Account.domains` semantics where `canonical: false` means "no filter" rather than
   * "exclude canonical".
   */
  canonical?: boolean | null;
  name?: DomainsNameFilterValue | null;
  version?: typeof ENSProtocolVersion.$inferType | null;
}

const VERSION_TO_DOMAIN_TYPE: Record<
  typeof ENSProtocolVersion.$inferType,
  "ENSv1Domain" | "ENSv2Domain"
> = {
  ENSv1: "ENSv1Domain",
  ENSv2: "ENSv2Domain",
};

/**
 * Build the SQL condition for `where.name`. The starts_with branch surfaces a default order via
 * {@link nameDefaultOrder} so the resolver prefers shorter names first when the caller doesn't
 * provide one.
 */
function nameCondition(filter?: DomainsNameFilterValue | null): SQL | undefined {
  if (!filter) return undefined;
  if (filter.starts_with) {
    return ilike(ensIndexerSchema.domain.canonicalName, `${filter.starts_with}%`);
  }
  if (filter.eq) {
    return inArray(ensIndexerSchema.domain.canonicalName, [filter.eq]);
  }
  if (filter.in) {
    // NOTE: avoid inArray([]) runtime error by short-circuit to an explicit empty result
    if (filter.in.length === 0) return sql`false`;
    return inArray(ensIndexerSchema.domain.canonicalName, filter.in);
  }
  return undefined;
}

/**
 * Surface a default order when the name filter is a typeahead prefix — shorter names first so
 * `vitalik.eth` outranks `vitalik.ethereum.foundation` for input `"vitalik.et"`.
 */
function nameDefaultOrder(
  filter?: DomainsNameFilterValue | null,
): Partial<typeof DomainsOrderInput.$inferInput> | undefined {
  if (filter?.starts_with) return { by: "DEPTH", dir: "ASC" };
  return undefined;
}

/**
 * Extract the order value from a connection result row based on the orderBy field.
 */
function getOrderValueFromResult(
  result: {
    canonicalName: InterpretedName | null;
    canonicalDepth: number | null;
    registrationTimestamp?: bigint | null;
    registrationExpiry?: bigint | null;
  },
  orderBy: typeof DomainsOrderBy.$inferType,
): DomainOrderValue {
  switch (orderBy) {
    case "NAME":
      return result.canonicalName;
    case "DEPTH":
      return result.canonicalDepth;
    case "REGISTRATION_TIMESTAMP":
      return result.registrationTimestamp ?? null;
    case "REGISTRATION_EXPIRY":
      return result.registrationExpiry ?? null;
  }
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
  context: ReturnType<typeof createContext>,
  {
    where,
    order,
    ...connectionArgs
  }: {
    where?: DomainsWhere | null;
    order?: Partial<typeof DomainsOrderInput.$inferInput> | null;
    first?: number | null;
    last?: number | null;
    before?: string | null;
    after?: string | null;
  },
) {
  const defaultOrder = nameDefaultOrder(where?.name);
  const orderBy = order?.by ?? defaultOrder?.by ?? DOMAINS_DEFAULT_ORDER_BY;
  const orderDir = order?.dir ?? defaultOrder?.dir ?? DOMAINS_DEFAULT_ORDER_DIR;

  const needsRegistrationJoin =
    orderBy === "REGISTRATION_TIMESTAMP" || orderBy === "REGISTRATION_EXPIRY";

  /**
   * `registryId === null` means "match nothing" — used by callers (e.g. Domain.subdomains) when
   * the upstream registry pointer is itself null. Anything other than an explicit `null` (i.e.
   * `undefined` or omitted) means "no registry filter".
   */
  const registryIdCondition =
    where?.registryId === null
      ? sql`false`
      : where?.registryId
        ? eq(ensIndexerSchema.domain.registryId, where.registryId)
        : undefined;

  // Compound WHERE: every filter folded into one AND expression. The planner sees all
  // predicates at once and is free to pick whichever index combination is cheapest.
  const filterConditions = and(
    where?.ownerId ? eq(ensIndexerSchema.domain.ownerId, where.ownerId) : undefined,
    registryIdCondition,
    where?.canonical === true ? eq(ensIndexerSchema.domain.canonical, true) : undefined,
    nameCondition(where?.name),
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
          // build order clauses (uses left(canonical_name, N) for NAME orderings to match
          // the (registry_id, left(canonical_name, N), id) composite index)
          const orderClauses = orderFindDomains(orderBy, orderDir, inverted);

          // decode cursors for keyset pagination
          const beforeCursor = before ? DomainCursors.decode(before) : undefined;
          const afterCursor = after ? DomainCursors.decode(after) : undefined;

          // Uniform SELECT shape. When the registration joins aren't required (NAME / DEPTH
          // orderings), project NULL for the registration order values — they are never read
          // because cursorFilter throws on a cursor/orderBy mismatch, and the NULL placeholder
          // keeps the result row type stable across both branches.
          const selectShape = {
            id: ensIndexerSchema.domain.id,
            canonicalName: ensIndexerSchema.domain.canonicalName,
            canonicalDepth: ensIndexerSchema.domain.canonicalDepth,
            registrationTimestamp: needsRegistrationJoin
              ? ensIndexerSchema.registration.start
              : sql<bigint | null>`NULL`.as("registrationTimestamp"),
            registrationExpiry: needsRegistrationJoin
              ? ensIndexerSchema.registration.expiry
              : sql<bigint | null>`NULL`.as("registrationExpiry"),
          };

          let query = ensDb.select(selectShape).from(ensIndexerSchema.domain).$dynamic();
          if (needsRegistrationJoin) {
            query = query.leftJoin(
              ensIndexerSchema.latestRegistrationIndex,
              eq(
                ensIndexerSchema.latestRegistrationIndex.domainId,
                ensIndexerSchema.domain.id,
              ),
            );
            query = query.leftJoin(
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
                beforeCursor
                  ? cursorFilter(beforeCursor, orderBy, orderDir, "before")
                  : undefined,
                afterCursor
                  ? cursorFilter(afterCursor, orderBy, orderDir, "after")
                  : undefined,
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

          const orderValueById = new Map(
            results.map((r) => [r.id, getOrderValueFromResult(r, orderBy)]),
          );

          return loadedDomains.map((domain): DomainWithOrderValue => {
            const __orderValue = orderValueById.get(domain.id);
            if (__orderValue === undefined)
              throw new Error(`Never: guaranteed to be DomainOrderValue`);

            return { ...domain, __orderValue };
          });
        },
      ),
  });
}
