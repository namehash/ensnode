import type { Name } from "../../ens";

/**
 * Represents request to Name Tokens API.
 */
export interface NameTokensRequest {
  /**
   * Name for which name tokens were requested.
   */
  name: Name;
}
