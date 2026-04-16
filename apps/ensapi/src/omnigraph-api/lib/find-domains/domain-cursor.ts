import type { DomainId } from "enssdk";

import { cursors } from "@/omnigraph-api/lib/cursors";
import type { DomainOrderValue } from "@/omnigraph-api/lib/find-domains/types";
import type { DomainsOrderBy } from "@/omnigraph-api/schema/domain";
import type { OrderDirection } from "@/omnigraph-api/schema/order-direction";

/**
 * Composite Domain cursor for keyset pagination.
 * Includes the order column value to enable proper tuple comparison without subqueries.
 *
 * @dev A composite cursor is required to support stable pagination over the set, regardless of which
 * column and which direction the set is ordered.
 */
export interface DomainCursor {
  /**
   * Stable identifier for tiebreaks.
   */
  id: DomainId;

  /**
   * The criteria by which the set is ordered. One of NAME, REGISTRATION_TIMESTAMP, or REGISTRATION_EXPIRY.
   */
  by: typeof DomainsOrderBy.$inferType;

  /**
   * The direction in which the set is ordered, either ASC or DESC.
   */
  dir: typeof OrderDirection.$inferType;

  /**
   * The value of the sort column for this Domain in the set.
   */
  value: DomainOrderValue;
}

/**
 * Encoding/Decoding helper for Composite DomainCursors.
 *
 * @dev it's base64'd (super)json
 */
export const DomainCursors = {
  encode: (cursor: DomainCursor): string => cursors.encode(cursor),
  // TODO: in the future, validate the cursor format matches DomainCursor
  decode: (cursor: string): DomainCursor => {
    try {
      return cursors.decode<DomainCursor>(cursor);
    } catch {
      throw new Error(
        "Invalid cursor: failed to decode cursor. The cursor may be malformed or from an incompatible query.",
      );
    }
  },
};
