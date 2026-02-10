import superjson from "superjson";

import type { DomainId } from "@ensnode/ensnode-sdk";

import type { DomainOrderValue } from "@/graphql-api/lib/find-domains/types";
import type { DomainsOrderBy } from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";

/**
 * Composite Domain cursor for keyset pagination.
 * Includes the order column value to enable proper tuple comparison without subqueries.
 *
 * @dev A composite cursor is required to support stable pagination over the set, regardless of which
 * column and which direction the set is ordered.
 */
export interface DomainCursor {
  // stable identifier for stable tiebreaks
  id: DomainId;
  // the column by which the set is ordered
  by: typeof DomainsOrderBy.$inferType;
  // the direction in which the set is ordered
  dir: typeof OrderDirection.$inferType;
  // the value of said sort column for this domain
  value: DomainOrderValue;
}

/**
 * Encoding/Decoding helper for Composite DomainCursors.
 *
 * @dev it's base64'd (super)json
 */
export const DomainCursor = {
  encode: (cursor: DomainCursor) =>
    Buffer.from(superjson.stringify(cursor), "utf8").toString("base64"),
  // TODO: in the future, validate the cursor format matches DomainCursor
  decode: (cursor: string) =>
    superjson.parse<DomainCursor>(Buffer.from(cursor, "base64").toString("utf8")),
};
