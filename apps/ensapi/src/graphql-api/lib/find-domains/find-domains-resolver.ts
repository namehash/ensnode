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
import { cursorFilter, type DomainsCTE, isEffectiveDesc, orderFindDomains } from "./find-domains";
import type {
  DomainOrderValue,
  DomainWithOrderValue,
  FindDomainsOrderArg,
  FindDomainsResult,
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
      return result.headLabel;
    case "REGISTRATION_TIMESTAMP":
      return result.registrationTimestamp;
    case "REGISTRATION_EXPIRY":
      return result.registrationExpiry;
  }
}

/**
 * GraphQL API resolver for domain connection queries. Accepts a pre-built domains CTE
 * (output of withOrderingMetadata) and handles cursor-based pagination, ordering, and
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
    /** Pre-built domains CTE from composing layers (withOrderingMetadata output) */
    domains: DomainsCTE;
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

      // build order clauses
      const orderClauses = orderFindDomains(domains, orderBy, orderDir, inverted);

      // decode cursors for keyset pagination
      const beforeCursor = before ? DomainCursor.decode(before) : undefined;
      const afterCursor = after ? DomainCursor.decode(after) : undefined;

      // build query with pagination constraints
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
