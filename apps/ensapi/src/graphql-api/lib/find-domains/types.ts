import type { DomainId } from "@ensnode/ensnode-sdk";

import type { Domain, DomainsOrderBy } from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";

/**
 * Order value type - string for NAME, bigint (or null) for timestamps.
 */
export type DomainOrderValue = string | bigint | null;

/**
 * Describes the ordering of the set of Domains.
 *
 * @dev derived from the GraphQL Input Types for 1:1 convenience
 */
export interface FindDomainsOrderArg {
  by?: typeof DomainsOrderBy.$inferType | null;
  dir?: typeof OrderDirection.$inferType | null;
}

/**
 * Domain with order value injected.
 *
 * @dev Relevant to composite DomainCursor encoding, see `domain-cursor.ts`
 */
export type DomainWithOrderValue = Domain & { __orderValue: DomainOrderValue };

/**
 * Result row from domains CTE. Includes columns for all supported orderings.
 *
 * @dev see `withOrderingMetadata`
 */
export type FindDomainsResult = {
  id: DomainId;
  sortableLabel: string | null;
  registrationTimestamp: bigint | null;
  registrationExpiry: bigint | null;
};
