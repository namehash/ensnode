import type { Name, Node } from "../../ens";

/**
 * Represents request to Name Tokens API.
 *
 * Either `domainId` or `name` must be provided, but not both.
 */
export interface NameTokensRequest {
  /**
   * Domain ID (namehash) for which name tokens were requested.
   */
  domainId?: Node;

  /**
   * Name for which name tokens were requested.
   */
  name?: Name;
}
