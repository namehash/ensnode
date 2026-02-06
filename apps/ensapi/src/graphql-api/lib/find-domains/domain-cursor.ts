import { z } from "zod/v4";

import type { DomainId } from "@ensnode/ensnode-sdk";

import type { DomainOrderValue } from "@/graphql-api/lib/find-domains/types";
import type { DomainsOrderBy } from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";

const stringToBigInt = z.codec(z.string(), z.bigint(), {
  decode: (str) => BigInt(str),
  encode: (bigint) => bigint.toString(),
});

const DomainCursorSchema = z.strictObject({
  id: z.string(),
  by: z.string(),
  dir: z.string(),
  value: z.union([z.string(), z.null(), stringToBigInt]),
});

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
 * @dev it's base64'd JSON with bigint encoding via zod
 */
export const DomainCursor = {
  encode: (cursor: DomainCursor) =>
    Buffer.from(JSON.stringify(DomainCursorSchema.encode(cursor)), "utf8").toString("base64"),
  // NOTE: the 'as DomainCursor' encodes the correct amount of type strictness and ensures that the
  // decoded zod object is castable to DomainCursor, without the complexity of inferring the types
  // exclusively from zod
  decode: (cursor: string) =>
    DomainCursorSchema.parse(
      JSON.parse(Buffer.from(cursor, "base64").toString("utf8")),
    ) as DomainCursor,
};
