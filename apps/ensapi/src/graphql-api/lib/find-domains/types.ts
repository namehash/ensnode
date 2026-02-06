import type { Address } from "viem";

import type { DomainId } from "@ensnode/ensnode-sdk";

import type { Domain, DomainsOrderBy } from "@/graphql-api/schema/domain";
import type { OrderDirection } from "@/graphql-api/schema/order-direction";

/**
 * Order value type - string for NAME, bigint (or null) for timestamps.
 */
export type DomainOrderValue = string | bigint | null;

/**
 * Describes the filters by which Domains can be filtered in `findDomains`.
 */
export interface FindDomainsWhereArg {
  /**
   * The `name` input may be a Partial InterpretedName by which the set of Domains is filtered.
   */
  name?: string | null;

  /**
   * The `owner` address may be specified, filtering the set of Domains by those that are effectively
   * owned by the specified Address.
   */
  owner?: Address | null;
}

/**
 * Describes the ordering of the set of Domains in `findDomains`.
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
 * Result row from findDomains CTE. Includes columns for all supported orderings.
 *
 * @dev see `findDomains`
 */
export type FindDomainsResult = {
  id: DomainId;
  leafLabelValue: string | null;
  registrationStart: bigint | null;
  registrationExpiry: bigint | null;
};
