import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and } from "drizzle-orm";

import type { context as createContext } from "@/graphql-api/context";
import {
  cursorFilter,
  type DomainWithOrderValue,
  type FindDomainsWhereArg,
  findDomains,
  getOrderValueFromResult,
  isEffectiveDesc,
  orderFindDomains,
} from "@/graphql-api/lib/find-domains";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import {
  DOMAINS_DEFAULT_ORDER_BY,
  DOMAINS_DEFAULT_ORDER_DIR,
  DomainCursor,
  DomainInterfaceRef,
  type DomainsOrderBy,
} from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";
import { db } from "@/lib/db";

interface FindDomainsOrderArg {
  by?: typeof DomainsOrderBy.$inferType | null;
  dir?: typeof OrderDirection.$inferType | null;
}

/**
 * Shared GraphQL API resolver for domains connection queries, used by Query.domains and
 * Account.domains.
 *
 * @param context - The GraphQL Context, required for Dataloader access
 * @param args - The GraphQL Args object (via t.connection) + FindDomains-specific args (where, order)
 */
export function resolveFindDomains(
  context: ReturnType<typeof createContext>,
  {
    where,
    order,
    ...args
  }: {
    // these resolver arguments from from t.connection
    first?: number | null;
    last?: number | null;
    before?: string | null;
    after?: string | null;
    // there are our additional where/order arguments
    where: FindDomainsWhereArg;
    order?: FindDomainsOrderArg | undefined | null;
  },
) {
  const orderBy = order?.by ?? DOMAINS_DEFAULT_ORDER_BY;
  const orderDir = order?.dir ?? DOMAINS_DEFAULT_ORDER_DIR;

  return resolveCursorConnection(
    {
      ...DEFAULT_CONNECTION_ARGS,
      args,
      toCursor: (domain: DomainWithOrderValue) =>
        DomainCursor.encode({
          id: domain.id,
          by: orderBy,
          value: domain.__orderValue,
        }),
    },
    async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
      const effectiveDesc = isEffectiveDesc(orderDir, inverted);

      // construct query for relevant domains
      const domains = findDomains(where);

      // build order clauses
      const orderClauses = orderFindDomains(domains, orderBy, orderDir, inverted);

      // decode cursors for keyset pagination
      const beforeCursor = before ? DomainCursor.decode(before) : undefined;
      const afterCursor = after ? DomainCursor.decode(after) : undefined;

      // execute with pagination constraints using tuple comparison
      const results = await db
        .with(domains)
        .select()
        .from(domains)
        .where(
          and(
            beforeCursor
              ? cursorFilter(domains, beforeCursor, orderBy, "before", effectiveDesc)
              : undefined,
            afterCursor
              ? cursorFilter(domains, afterCursor, orderBy, "after", effectiveDesc)
              : undefined,
          ),
        )
        .orderBy(...orderClauses)
        .limit(limit);

      // Map CTE results by id for order value lookup
      const orderValueById = new Map(
        results.map((r) => [r.id, getOrderValueFromResult(r, orderBy)]),
      );

      // Load full Domain entities via dataloader
      const loadedDomains = await rejectAnyErrors(
        DomainInterfaceRef.getDataloader(context).loadMany(results.map((result) => result.id)),
      );

      // Attach order values for cursor encoding
      return loadedDomains.map((domain) => ({
        ...domain,
        __orderValue: orderValueById.get(domain.id),
      }));
    },
  );
}
