import { trace } from "@opentelemetry/api";
import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count, eq, ilike, inArray, type SQL, sql } from "drizzle-orm";
import type { NormalizedAddress, RegistryId } from "enssdk";

import di from "@/di";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import { makeLogger } from "@/lib/logger";
import { DomainCursors } from "@/omnigraph-api/lib/find-domains/domain-cursor";
import {
  cursorFilter,
  orderFindDomains,
  truncateNameForCursor,
} from "@/omnigraph-api/lib/find-domains/find-domains-resolver-helpers";
import type { DomainOrderValue } from "@/omnigraph-api/lib/find-domains/types";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import {
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/omnigraph-api/schema/constants";
import type { Domain } from "@/omnigraph-api/schema/domain";
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
  (typeof di.context.ensIndexerSchema.domainType.enumValues)[number]
> = {
  ENSv1: "ENSv1Domain",
  ENSv2: "ENSv2Domain",
};

/**
 * Build the SQL condition for `where.name`.
 */
function nameCondition(filter: typeof DomainsNameFilter.$inferInput): SQL {
  const { ensIndexerSchema } = di.context;
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
 * GraphQL API resolver for domain connection queries. Builds a single flat SELECT over `domains`
 * (filters and ordering both resolve against `domains` columns) and hydrates fully-formed Domain
 * rows in keyset order. Handles cursor-based pagination and ordering. Used by `Query.domains`,
 * `Account.domains`, `Registry.domains`, and `Domain.subdomains`.
 *
 * @param args - Compound `where` filter, optional ordering, and relay connection args
 */
export function resolveFindDomains({
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
}) {
  const defaultOrder = getDefaultOrder(where);
  const orderBy = order?.by ?? defaultOrder.by;
  const orderDir = order?.dir ?? defaultOrder.dir;

  const { ensIndexerSchema } = di.context;

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
        const { ensDb } = di.context;
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

          // Hydrate Domains directly: every order value lives on `domains` and the only eagerly
          // loaded relation is `label`, so a single relational query (mirroring the Domain
          // dataloader's `with: { label: true }`) returns fully-formed Domain rows in keyset order —
          // no second round-trip through the dataloader. The keyset/order scan still rides the
          // `domains` composite indexes; `label` is joined only for the `LIMIT`ed rows.
          const { ensDb } = di.context;
          const finalQuery = ensDb.query.domain.findMany({
            where: and(
              filterConditions,
              beforeCursor ? cursorFilter(beforeCursor, orderBy, orderDir, "before") : undefined,
              afterCursor ? cursorFilter(afterCursor, orderBy, orderDir, "after") : undefined,
            ),
            orderBy: orderClauses,
            limit,
            with: { label: true },
          });

          logger.debug({ sql: finalQuery.toSQL() });

          const loadedDomains = await withActiveSpanAsync(
            tracer,
            "find-domains.connection",
            { orderBy, orderDir, limit },
            () => finalQuery,
          );

          return loadedDomains.map((domain): DomainWithOrderValue => {
            const __orderValue: DomainOrderValue = (() => {
              switch (orderBy) {
                case "NAME":
                  return truncateNameForCursor(domain.canonicalName);
                case "DEPTH":
                  return domain.canonicalDepth;
                case "REGISTRATION_TIMESTAMP":
                  return domain.__latestRegistrationStart;
                case "REGISTRATION_EXPIRY":
                  return domain.__latestRegistrationExpiry;
              }
            })();
            return { ...domain, __orderValue };
          });
        },
      ),
  });
}
