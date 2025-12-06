import type { Name, Node } from "../../ens";

/**
 * Records Filters: Filter Types
 */
export const NameTokensFilterTypes = {
  ByDomainId: "byDomainId",
} as const;

export type NameTokensFilterType =
  (typeof NameTokensFilterTypes)[keyof typeof NameTokensFilterTypes];

export type NameTokensFilterByDomainId = {
  filterType: typeof NameTokensFilterTypes.ByDomainId;
  domainId: Node;
};

export type NameTokensFilter = NameTokensFilterByDomainId;

/**
 * Records Orders
 */
export const NameTokensOrders = {
  LatestNameTokens: "orderBy[tokenId]=desc",
} as const;

export type NameTokensOrder = (typeof NameTokensOrders)[keyof typeof NameTokensOrders];

/**
 * Represents a request to Name Tokens API.
 */
export interface NameTokensRequest {
  /**
   * Name for which name tokens were requested.
   */
  name: Name;

  /**
   * Order applied while generating results.
   */
  order?: NameTokensOrder;
}
