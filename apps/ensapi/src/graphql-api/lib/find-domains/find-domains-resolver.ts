import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, count } from "drizzle-orm";

import type { context as createContext } from "@/graphql-api/context";
import type {
  DomainsWithOrderingMetadata,
  DomainsWithOrderingMetadataResult,
} from "@/graphql-api/lib/find-domains/layers/with-ordering-metadata";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import {
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/graphql-api/schema/constants";
import {
  DOMAINS_DEFAULT_ORDER_BY,
  DOMAINS_DEFAULT_ORDER_DIR,
  type Domain,
  DomainInterfaceRef,
  type DomainsOrderBy,
} from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";
import { db } from "@/lib/db";
import { makeLogger } from "@/lib/logger";

import { DomainCursors } from "./domain-cursor";
import { cursorFilter, orderFindDomains } from "./find-domains-resolver-helpers";
import type { DomainOrderValue } from "./types";

/**
 * Describes the ordering of the set of Domains.
 *
 * @dev derived from the GraphQL Input Types for 1:1 convenience
 */
interface FindDomainsOrderArg {
  by?: typeof DomainsOrderBy.$inferType | null;
  dir?: typeof OrderDirection.$inferType | null;
}

/**
 * Domain with order value injected.
 *
 * @dev Relevant to composite DomainCursor encoding, see `domain-cursor.ts`
 */
type DomainWithOrderValue = Domain & { __orderValue: DomainOrderValue };

const logger = makeLogger("find-domains-resolver");

/**
 * Extract the order value from a findDomains result row based on the orderBy field.
 */
function getOrderValueFromResult(
  result: DomainsWithOrderingMetadataResult,
  orderBy: typeof DomainsOrderBy.$inferType,
): DomainOrderValue {
  switch (orderBy) {
    case "NAME":
      return result.sortableLabel;
    case "REGISTRATION_TIMESTAMP":
      return result.registrationTimestamp;
    case "REGISTRATION_EXPIRY":
      return result.registrationExpiry;
  }
}

/**
 * GraphQL API resolver for domain connection queries. Accepts a pre-built domains CTE
 * ({@link DomainsWithOrderingMetadata}) and handles cursor-based pagination, ordering, and
 * dataloader loading.
 *
 * Used by Query.domains, Account.domains, Registry.domains, and Domain.subdomains.
 *
 * @param context - The GraphQL Context, required for Dataloader access
 * @param args - The domains CTE, optional ordering, and relay connection args
 */
export function resolveFindDomains(
  context: ReturnType<typeof createContext>,
  {
    domains,
    order,
    ...connectionArgs
  }: {
    /** Pre-built domains CTE from `withOrderingMetadata` */
    domains: DomainsWithOrderingMetadata;
    /** Optional ordering; defaults to NAME ASC */
    order?: FindDomainsOrderArg | undefined | null;

    // relay connection args from t.connection
    first?: number | null;
    last?: number | null;
    before?: string | null;
    after?: string | null;
  },
) {
  const orderBy = order?.by ?? DOMAINS_DEFAULT_ORDER_BY;
  const orderDir = order?.dir ?? DOMAINS_DEFAULT_ORDER_DIR;

  return lazyConnection({
    totalCount: () =>
      db
        .with(domains)
        .select({ count: count() })
        .from(domains)
        .then((rows) => rows[0].count),

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
          // build order clauses
          const orderClauses = orderFindDomains(domains, orderBy, orderDir, inverted);

          // decode cursors for keyset pagination
          const beforeCursor = before ? DomainCursors.decode(before) : undefined;
          const afterCursor = after ? DomainCursors.decode(after) : undefined;

          // build query with pagination constraints
          const query = db
            .with(domains)
            .select()
            .from(domains)
            .where(
              and(
                beforeCursor
                  ? cursorFilter(domains, beforeCursor, orderBy, orderDir, "before")
                  : undefined,
                afterCursor
                  ? cursorFilter(domains, afterCursor, orderBy, orderDir, "after")
                  : undefined,
              ),
            )
            .orderBy(...orderClauses)
            .limit(limit);

          // log the generated SQL for debugging
          logger.debug({ sql: query.toSQL() });

          // execute query
          const results = await query;

          // load Domain entities via dataloader
          const loadedDomains = await rejectAnyErrors(
            DomainInterfaceRef.getDataloader(context).loadMany(results.map((result) => result.id)),
          );

          // map results by id for faster order value lookup
          const orderValueById = new Map(
            results.map((r) => [r.id, getOrderValueFromResult(r, orderBy)]),
          );

          // inject order values into each result so that it can be encoded into the cursor
          // (see DomainCursor for more information)
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
