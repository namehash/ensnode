import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and } from "drizzle-orm";

import type { context as createContext } from "@/graphql-api/context";
import { rejectAnyErrors } from "@/graphql-api/lib/reject-any-errors";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import {
  DOMAINS_DEFAULT_ORDER_BY,
  DOMAINS_DEFAULT_ORDER_DIR,
  DomainInterfaceRef,
  type DomainsOrderBy,
} from "@/graphql-api/schema/domain";
import { db } from "@/lib/db";
import { makeLogger } from "@/lib/logger";

import { DomainCursor } from "./domain-cursor";
import { cursorFilter, findDomains, isEffectiveDesc, orderFindDomains } from "./find-domains";
import type {
  DomainOrderValue,
  DomainWithOrderValue,
  FindDomainsOrderArg,
  FindDomainsResult,
  FindDomainsWhereArg,
} from "./types";

const logger = makeLogger("find-domains-resolver");

/**
 * Extract the order value from a findDomains result row based on the orderBy field.
 */
function getOrderValueFromResult(
  result: FindDomainsResult,
  orderBy: typeof DomainsOrderBy.$inferType,
): DomainOrderValue {
  switch (orderBy) {
    case "NAME":
      return result.leafLabelValue;
    case "REGISTRATION_TIMESTAMP":
      return result.registrationStart;
    case "REGISTRATION_EXPIRY":
      return result.registrationExpiry;
  }
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
    ...connectionArgs
  }: {
    // `where` MUST be provided, we don't currently allow iterating over the full set of domains
    where: FindDomainsWhereArg;
    // `order` MAY be provided; defaults are used otherwise
    order?: FindDomainsOrderArg | undefined | null;

    // these resolver arguments are from t.connection
    first?: number | null;
    last?: number | null;
    before?: string | null;
    after?: string | null;
  },
) {
  const orderBy = order?.by ?? DOMAINS_DEFAULT_ORDER_BY;
  const orderDir = order?.dir ?? DOMAINS_DEFAULT_ORDER_DIR;

  return resolveCursorConnection(
    {
      ...DEFAULT_CONNECTION_ARGS,
      args: connectionArgs,
      toCursor: (domain: DomainWithOrderValue) =>
        DomainCursor.encode({
          id: domain.id,
          by: orderBy,
          dir: orderDir,
          value: domain.__orderValue,
        }),
    },
    async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
      // identify whether the effective sort direction is descending
      const effectiveDesc = isEffectiveDesc(orderDir, inverted);

      // construct query for relevant domains
      const domains = findDomains(where);

      // build order clauses
      const orderClauses = orderFindDomains(domains, orderBy, orderDir, inverted);

      // decode cursors for keyset pagination
      const beforeCursor = before ? DomainCursor.decode(before) : undefined;
      const afterCursor = after ? DomainCursor.decode(after) : undefined;

      // build query with pagination constraints using tuple comparison
      const query = db
        .with(domains)
        .select()
        .from(domains)
        .where(
          and(
            beforeCursor
              ? cursorFilter(domains, beforeCursor, orderBy, orderDir, "before", effectiveDesc)
              : undefined,
            afterCursor
              ? cursorFilter(domains, afterCursor, orderBy, orderDir, "after", effectiveDesc)
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
        if (__orderValue === undefined) throw new Error(`Never: guaranteed to be DomainOrderValue`);

        return { ...domain, __orderValue };
      });
    },
  );
}
