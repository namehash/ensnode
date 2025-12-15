import type { Name, Node } from "../../ens";

/**
 * Represents request to Name Tokens API.
 */
export interface NameTokensRequestByDomainId {
  domainId: Node;

  /**
   * Name for which name tokens were requested.
   */
  name?: undefined;
}

/**
 * Represents request to Name Tokens API.
 */
export interface NameTokensRequestByName {
  domainId?: undefined;

  /**
   * Name for which name tokens were requested.
   */
  name: Name;
}

export type NameTokensRequest = NameTokensRequestByDomainId | NameTokensRequestByName;
